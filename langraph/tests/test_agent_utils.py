import json

import pytest

from langraph.agents.utils import (
    FORECAST_WINDOWS,
    compact_columnar,
    extract_message_text,
    parse_forecast,
)

LATITUDE = "-36.8547"
LONGITUDE = "174.8317"
START_DATE = "2026-08-05"


def build_forecast(activity="sup", days=10, entry=None):
    """Build a full set of scored entries, as `parse_forecast` expects them."""
    from datetime import date, timedelta

    start = date.fromisoformat(START_DATE)
    return {
        f"{activity};{start + timedelta(days=day)};{window};{LATITUDE},{LONGITUDE}":
            entry if entry is not None else {"score": 80}
        for day in range(days)
        for window in FORECAST_WINDOWS
    }


def parse(data, activity="sup"):
    return parse_forecast(json.dumps(data), activity, START_DATE, LATITUDE, LONGITUDE)


def test_string_input():
    assert extract_message_text("hello") == "hello"


def test_list_of_strings():
    assert extract_message_text(["a", "b"]) == "a\nb"


def test_list_of_dicts_with_text():
    content = [{"text": "first"}, {"text": "second"}]
    assert extract_message_text(content) == "first\nsecond"


def test_mixed_list():
    content = ["plain", {"text": "from dict"}]
    assert extract_message_text(content) == "plain\nfrom dict"


def test_dict_missing_text_key():
    content = [{"type": "image", "url": "img.png"}]
    assert extract_message_text(content) == ""


def test_empty_list():
    assert extract_message_text([]) == ""


def test_non_string_non_list():
    assert extract_message_text(42) == "42"


def test_dict_with_empty_text():
    content = [{"text": ""}]
    assert extract_message_text(content) == ""


def test_compact_columnar_strips_whitespace():
    content = """{
      "fields": ["time", "seaTempC"],
      "rows": [["2026-08-04T06:00", 12.8], ["2026-08-04T07:00", 12.9]]
    }"""
    assert compact_columnar(content) == (
        '{"fields":["time","seaTempC"],'
        '"rows":[["2026-08-04T06:00",12.8],["2026-08-04T07:00",12.9]]}'
    )


def test_compact_columnar_allows_empty_rows():
    assert compact_columnar('{"fields": ["time"], "rows": []}') == (
        '{"fields":["time"],"rows":[]}'
    )


def test_compact_columnar_allows_null_values():
    content = '{"fields": ["time", "waveHeightM"], "rows": [["2026-08-13T06:00", null]]}'
    assert compact_columnar(content) == (
        '{"fields":["time","waveHeightM"],"rows":[["2026-08-13T06:00",null]]}'
    )


def test_compact_columnar_rejects_invalid_json():
    with pytest.raises(ValueError, match="not valid JSON"):
        compact_columnar('{"fields": ["time"], "rows": [["06:00"')


def test_compact_columnar_rejects_non_object():
    with pytest.raises(ValueError, match="`fields` list"):
        compact_columnar('[["time"], ["06:00"]]')


def test_compact_columnar_rejects_missing_fields():
    with pytest.raises(ValueError, match="`fields` list"):
        compact_columnar('{"rows": []}')


def test_compact_columnar_rejects_empty_fields():
    with pytest.raises(ValueError, match="`fields` list"):
        compact_columnar('{"fields": [], "rows": []}')


def test_compact_columnar_rejects_missing_rows():
    with pytest.raises(ValueError, match="`rows` to be a list of lists"):
        compact_columnar('{"fields": ["time"]}')


def test_compact_columnar_rejects_ragged_row():
    content = '{"fields": ["time", "seaTempC"], "rows": [["06:00", 12.8], ["07:00"]]}'
    with pytest.raises(ValueError, match="Row 1 has 1 values, expected 2"):
        compact_columnar(content)


def test_compact_columnar_rejects_non_list_row():
    content = '{"fields": ["time"], "rows": [{"time": "06:00"}]}'
    with pytest.raises(ValueError, match="`rows` to be a list of lists"):
        compact_columnar(content)


def test_parse_forecast_returns_a_full_set_of_entries():
    data = build_forecast()
    assert parse(data) == data
    assert len(data) == 40


def test_parse_forecast_allows_null_factors():
    # Days beyond the weather range come back null, and must still parse.
    data = build_forecast(entry={"score": None, "wind": None})
    assert parse(data) == data


def test_parse_forecast_rejects_invalid_json():
    with pytest.raises(ValueError, match="not valid JSON"):
        parse_forecast('{"sup;2026-08-05', "sup", START_DATE, LATITUDE, LONGITUDE)


def test_parse_forecast_rejects_non_object():
    with pytest.raises(ValueError, match="object of forecast entries"):
        parse_forecast("[]", "sup", START_DATE, LATITUDE, LONGITUDE)


def test_parse_forecast_rejects_a_short_answer():
    # One trace wrote 5 of 40 entries and still reported success.
    data = dict(list(build_forecast().items())[:5])
    with pytest.raises(ValueError, match="has 5 entries, expected 40"):
        parse(data)


def test_parse_forecast_rejects_a_missing_day():
    data = build_forecast(days=9)
    with pytest.raises(ValueError, match=r"missing \['sup;2026-08-14"):
        parse(data)


def test_parse_forecast_rejects_a_missing_window():
    data = build_forecast()
    del data[f"sup;{START_DATE};evening;{LATITUDE},{LONGITUDE}"]
    with pytest.raises(ValueError, match="has 39 entries, expected 40"):
        parse(data)


def test_parse_forecast_rejects_an_unexpected_entry():
    data = build_forecast()
    data[f"sup;2026-09-01;morning;{LATITUDE},{LONGITUDE}"] = {"score": 80}
    with pytest.raises(ValueError, match="unexpected entries"):
        parse(data)


def test_parse_forecast_rejects_the_wrong_activity():
    with pytest.raises(ValueError, match="expected 40"):
        parse(build_forecast(activity="kayaking"), activity="sup")


def test_parse_forecast_rejects_the_wrong_geolocation():
    data = build_forecast()
    with pytest.raises(ValueError, match="expected 40"):
        parse_forecast(json.dumps(data), "sup", START_DATE, "-41.2", "174.7")
