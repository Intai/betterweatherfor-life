import pytest

from langraph.utils.columnar import compact_columnar


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
