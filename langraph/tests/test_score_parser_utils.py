import json

import pytest

from langraph.utils.score_parser import (
    ALL_DAY,
    FACTOR_FIELDS,
    FORECAST_WINDOWS,
    condition_for,
    forecast_dates,
    parse_forecast,
)

LATITUDE = "-36.8547"
LONGITUDE = "174.8317"
START_DATE = "2026-08-05"
DATES = forecast_dates(START_DATE)


def expected_keys(activity="sup"):
    """Every key a full answer rebuilds, spelled out rather than reusing the parser."""
    return {
        f"{activity};{date};{window};{LATITUDE},{LONGITUDE}"
        for date in DATES
        for window in FORECAST_WINDOWS
    }


# A full day of hourly scores: 06:00 to 22:00 inclusive, the range every fetch
# source trims to. Distinct values so a mis-sliced window is visible.
DAY_SCORES = [40 + hour for hour in range(17)]


def build_entry(**overrides):
    """One scored entry, sparse — a factor with nothing to say is left out."""
    entry = {
        "score": 80,
        "wind": {
            "speed": "8km/h",
            "gust": "12km/h",
            "direction": "NE",
            "condition": "ideal",
            "summary": "Light breeze.",
        },
        "summary": "Easy paddling.",
        "analysis": "Calm all day.",
    }
    entry.update(overrides)
    return {field: value for field, value in entry.items() if value is not _ABSENT}


_ABSENT = object()


def build_response(days=10, windows=FORECAST_WINDOWS, entry=None,
                hourly_from="06:00", hourly=None):
    """Build a sparse payload covering the first `days` of the forecast range."""
    dates = forecast_dates(START_DATE)[:days]
    entries = {
        f"{date};{window}": dict(entry if entry is not None else build_entry())
        for date in dates
        for window in windows
    }
    scores = DAY_SCORES[-(23 - int(hourly_from[:2])):]
    if hourly is None:
        hourly = {date: {"from": hourly_from, "scores": scores} for date in dates}
    return {"entries": entries, "hourly": hourly}


def parse_both(response, activity="sup"):
    """Return the `(forecast, problems)` pair for a payload."""
    return parse_forecast(json.dumps(response), DATES, activity, LATITUDE, LONGITUDE)


def parse(response, activity="sup"):
    return parse_both(response, activity)[0]


def skipped(response, activity="sup"):
    """Parse a payload whose entries include a bad one, and return both halves."""
    forecast, problems = parse_both(response, activity)
    assert problems, "expected the bad entry to be reported"
    return forecast, problems[0]


def test_forecast_dates_spans_ten_days():
    dates = forecast_dates(START_DATE)
    assert len(dates) == 10
    assert dates[0] == "2026-08-05"
    assert dates[-1] == "2026-08-14"


def test_forecast_dates_crosses_a_month_boundary():
    assert forecast_dates("2026-08-30")[-1] == "2026-09-08"


def key(window="all-day", activity="sup", date=START_DATE):
    return f"{activity};{date};{window};{LATITUDE},{LONGITUDE}"


def key_short(window="all-day", date=START_DATE):
    return f"{date};{window}"


def test_parse_forecast_returns_an_entry_per_window():
    entries = parse(build_response())
    assert len(entries) == 40
    assert entries.keys() == expected_keys()


def test_parse_forecast_rebuilds_the_key_and_activity_rather_than_reading_them():
    # A scorer once copied the prompt's illustrative coordinates into all 40 keys.
    entries = parse(build_response(days=1), activity="kayaking")
    entry = entries[key(activity="kayaking")]
    assert entry["activity"] == "kayaking"
    assert entry["date"] == START_DATE
    assert entry["timeRange"] == ALL_DAY


def test_parse_forecast_derives_the_condition_from_the_score():
    # The scorer labelled sub-40 scores `marginal` on 12 of 160 entries last run.
    entries = parse(build_response(days=1, entry=build_entry(score=38)))
    assert {entry["condition"] for entry in entries.values()} == {"unsuitable"}


def test_parse_forecast_allows_a_missing_score():
    # A window whose hours have already passed carries almost nothing.
    entry = parse(build_response(days=1, entry={"summary": "Nothing to report."}))[
        key("morning")
    ]
    assert entry["score"] is None
    assert entry["condition"] is None
    assert entry["wind"] is None


def test_parse_forecast_keeps_a_short_answer_for_the_caller_to_top_up():
    # One run answered with the first day of ten; the node re-asks for the rest.
    assert len(parse(build_response(days=1))) == 4


def test_parse_forecast_keeps_a_multi_day_partial_answer():
    # The same top-up path, reached after several days rather than one.
    assert len(parse(build_response(days=3))) == 12


def test_parse_forecast_strips_a_json_code_fence():
    # One scorer fenced a 32k-token answer despite being told not to.
    fenced = f"```json\n{json.dumps(build_response(days=1))}\n```"
    assert len(parse_forecast(fenced, DATES, "sup", LATITUDE, LONGITUDE)[0]) == 4


def test_parse_forecast_strips_a_bare_code_fence():
    fenced = f"```\n{json.dumps(build_response(days=1))}\n```"
    assert len(parse_forecast(fenced, DATES, "sup", LATITUDE, LONGITUDE)[0]) == 4


def test_parse_forecast_strips_an_unterminated_fence():
    # A response cut off at its token cap never emits the closing fence.
    fenced = f"```json\n{json.dumps(build_response(days=1))}"
    assert len(parse_forecast(fenced, DATES, "sup", LATITUDE, LONGITUDE)[0]) == 4


def test_parse_forecast_leaves_unfenced_json_alone():
    assert len(parse(build_response(days=1))) == 4


def test_parse_forecast_rejects_invalid_json():
    with pytest.raises(ValueError, match="not valid JSON"):
        parse_forecast('{"entries": {', DATES, "sup", LATITUDE, LONGITUDE)


def test_parse_forecast_quotes_the_text_around_the_break():
    # A complete object followed by a second one — the CronJob's actual failure,
    # which `json` reports only as an offset.
    with pytest.raises(ValueError, match=r"around: .*hourly"):
        parse_forecast(
            '{"entries":{}}{"hourly":{}}', DATES, "sup", LATITUDE, LONGITUDE
        )


def test_parse_forecast_reports_the_start_when_there_is_no_offset():
    with pytest.raises(ValueError, match="not valid JSON"):
        parse_forecast(None, DATES, "sup", LATITUDE, LONGITUDE)


def test_parse_forecast_rejects_a_missing_entries_object():
    with pytest.raises(ValueError, match="non-empty `entries` object"):
        parse_forecast("[]", DATES, "sup", LATITUDE, LONGITUDE)


def test_parse_forecast_rejects_an_empty_entries_object():
    response = build_response(days=1)
    response["entries"] = {}
    with pytest.raises(ValueError, match="non-empty `entries` object"):
        parse(response)


@pytest.mark.parametrize("bad", ["not an object", [], 80])
def test_parse_forecast_skips_an_entry_that_is_not_an_object(bad):
    response = build_response(days=1)
    response["entries"][key_short()] = bad
    forecast, problem = skipped(response)
    assert "needs to be an object" in problem
    # The other three windows are kept, so only one date is re-asked.
    assert key() not in forecast
    assert len(forecast) == 3


def test_parse_forecast_allows_an_empty_entry():
    # A window whose hours have already passed has nothing to report, and the
    # prompt asks for `{}` rather than a wall of nulls.
    entry = parse(build_response(days=1, entry={}))[key("morning")]
    assert entry["score"] is None
    assert entry["condition"] is None
    assert all(entry[factor] is None for factor in FACTOR_FIELDS)


def test_parse_forecast_skips_a_malformed_entry_key():
    response = build_response(days=1)
    response["entries"]["2026-08-05"] = build_entry()
    forecast, problem = skipped(response)
    assert "needs to be `date;timeRange`" in problem
    assert len(forecast) == 4


def test_parse_forecast_ignores_an_unknown_entry_field():
    # Refusing over a name once cost cycling all 40 of its entries.
    response = build_response(days=1)
    response["entries"][key_short()]["windChill"] = "-2°C"
    forecast, problem = skipped(response)
    assert "ignored unknown fields" in problem
    assert len(forecast) == 4
    assert forecast[key()]["score"] == 80


@pytest.mark.parametrize("bad", ["8km/h", [], 80])
def test_parse_forecast_skips_an_entry_whose_factor_is_not_an_object(bad):
    response = build_response(days=1)
    response["entries"][key_short()]["wind"] = bad
    forecast, problem = skipped(response)
    assert "`wind` to be an object" in problem
    assert len(forecast) == 3


def test_parse_forecast_reads_an_empty_factor_as_absent():
    response = build_response(days=1)
    response["entries"][key_short()]["wind"] = {}
    assert parse(response)[key()]["wind"] is None


def test_parse_forecast_ignores_an_unknown_factor_field():
    # A scorer wrote `humidity.pct` for `percentage`; the rest of the object is
    # still worth keeping.
    response = build_response(days=1)
    response["entries"][key_short()]["wind"]["chill"] = "-2°C"
    forecast, problem = skipped(response)
    assert "ignored unknown `wind` fields" in problem
    assert len(forecast) == 4
    assert "chill" not in forecast[key()]["wind"]
    assert forecast[key()]["wind"]["speed"] == "8km/h"


def test_parse_forecast_treats_an_omitted_factor_as_null():
    # Cycling leaves out tide, water and visibility rather than nulling them.
    entry = parse(build_response(days=1), activity="cycling")[key(activity="cycling")]
    assert entry["tide"] is None
    assert entry["water"] is None
    assert entry["visibility"] is None
    assert entry["humidity"] is None


def test_parse_forecast_keeps_both_daylight_times():
    # Sunset and civil twilight end are two different times, not two names for
    # one, so an answer carrying both keeps both.
    response = build_response(days=1, entry=build_entry(
        daylight={"sunset": "17:39", "civilTwilightEnd": "18:05"},
    ))
    entry = parse(response, activity="cycling")[key(activity="cycling")]
    assert entry["daylight"] == {"sunset": "17:39", "civilTwilightEnd": "18:05"}


@pytest.mark.parametrize("path, factor, field, value", [
    ("score", None, "score", 120),
    ("score", None, "score", "eighty"),
    ("score", None, "score", True),
    ("uv.index", "uv", "index", "high"),
    ("wind.condition", "wind", "condition", "great"),
    ("temp.condition", "temp", "condition", ""),
    ("tide.state", "tide", "state", "Slack"),
    ("tide.percentage", "tide", "percentage", 140),
    ("tide.nextHigh", "tide", "nextHigh", "25:00"),
    ("tide.nextLow", "tide", "nextLow", "16-15"),
    ("daylight.sunset", "daylight", "sunset", "6am"),
    ("daylight.civilTwilightEnd", "daylight", "civilTwilightEnd", "6am"),
])
def test_parse_forecast_skips_an_entry_with_a_mistyped_field(path, factor, field, value):
    entry = build_entry() if factor is None else build_entry(**{factor: {field: value}})
    if factor is None:
        entry[field] = value
    response = build_response(days=1, entry=entry)
    forecast, problem = skipped(response)
    assert f"invalid `{path}`" in problem
    assert forecast == {}


def test_parse_forecast_accepts_a_quoted_integer():
    # A real answer came back with a UV index of "1"; quoting a number is harmless.
    response = build_response(
        days=1,
        entry=build_entry(score="72", uv={"index": "1"}, tide={"percentage": "65"}),
        hourly={START_DATE: {"from": "06:00", "scores": ["80", "70"]}},
    )
    entry = parse(response)[key()]
    assert entry["score"] == 72
    assert entry["uv"]["index"] == 1
    assert entry["tide"]["percentage"] == 65
    assert [slot["score"] for slot in entry["hourly"]] == [80, 70]


def test_parse_forecast_accepts_a_quoted_null():
    # A cycling answer wrote "null" into a tide percentage it cannot use.
    response = build_response(days=1, entry=build_entry(tide={"percentage": "null"}))
    assert parse(response)[key()]["tide"] == {"percentage": None}


def test_parse_forecast_skips_an_entry_for_a_date_outside_the_range():
    response = build_response(days=1)
    response["entries"]["2026-09-01;all-day"] = build_entry()
    forecast, problem = skipped(response)
    assert "unexpected date" in problem
    assert len(forecast) == 4


def test_parse_forecast_skips_an_entry_with_an_unknown_time_range():
    response = build_response(days=1)
    response["entries"][f"{START_DATE};midnight"] = build_entry()
    forecast, problem = skipped(response)
    assert "unknown timeRange" in problem
    assert len(forecast) == 4


def test_parse_forecast_rejects_a_missing_hourly_object():
    response = build_response(days=1)
    del response["hourly"]
    with pytest.raises(ValueError, match="non-empty `hourly` object"):
        parse(response)


def test_parse_forecast_rejects_an_empty_hourly_object():
    with pytest.raises(ValueError, match="non-empty `hourly` object"):
        parse(build_response(days=1, hourly={}))


def test_parse_forecast_drops_a_date_with_no_hourly_scores():
    # Every window slices its scores out of the day's array, so without them the
    # date has to be asked for again.
    response = build_response(days=1, hourly={"2026-01-01": {"from": "06:00", "scores": [80]}})
    forecast, problem = skipped(response)
    assert "no hourly scores" in problem
    assert forecast == {}


@pytest.mark.parametrize("day", [[80, 81], {}, "06:00"])
def test_parse_forecast_drops_a_date_whose_hourly_is_not_an_object(day):
    forecast, problem = skipped(build_response(days=1, hourly={START_DATE: day}))
    assert "non-empty object" in problem
    assert forecast == {}


@pytest.mark.parametrize("day", [
    {"from": "6am", "scores": [80]},
    {"from": None, "scores": [80]},
    {"scores": [80]},
])
def test_parse_forecast_drops_a_date_with_an_invalid_hourly_start(day):
    forecast, problem = skipped(build_response(days=1, hourly={START_DATE: day}))
    assert "invalid `from`" in problem
    assert forecast == {}


@pytest.mark.parametrize("scores", ["80,81", ["ideal"], [180], None])
def test_parse_forecast_drops_a_date_with_invalid_hourly_scores(scores):
    response = build_response(days=1, hourly={START_DATE: {"from": "06:00", "scores": scores}})
    forecast, problem = skipped(response)
    assert "not a list of scores" in problem
    assert forecast == {}


def test_parse_forecast_slices_hourly_scores_per_window():
    entries = parse(build_response(days=1))
    hours = {
        window: [slot["time"] for slot in entries[key(window)]["hourly"]]
        for window in FORECAST_WINDOWS
    }
    assert hours[ALL_DAY] == [f"{hour:02d}:00" for hour in range(6, 23)]
    assert hours["morning"] == [f"{hour:02d}:00" for hour in range(6, 12)]
    assert hours["afternoon"] == [f"{hour:02d}:00" for hour in range(12, 18)]
    assert hours["evening"] == [f"{hour:02d}:00" for hour in range(18, 23)]


def test_parse_forecast_keeps_the_windows_consistent_with_the_day():
    # The scorer's own arrays disagreed with the day they belonged to, 40 days of 40.
    entries = parse(build_response(days=1))
    sliced = [
        slot
        for window in ("morning", "afternoon", "evening")
        for slot in entries[key(window)]["hourly"]
    ]
    assert sliced == entries[key()]["hourly"]


def test_parse_forecast_derives_each_hourly_condition():
    response = build_response(
        days=1, hourly={START_DATE: {"from": "06:00", "scores": [85, 65, 45, 25]}}
    )
    assert [slot["condition"] for slot in parse(response)[key()]["hourly"]] == [
        "ideal", "acceptable", "marginal", "unsuitable",
    ]


def test_parse_forecast_leaves_hourly_null_for_a_window_with_no_hours():
    # Day one starts late when its early hours have already passed.
    entries = parse(build_response(days=1, hourly_from="16:00"))
    assert entries[key("morning")]["hourly"] is None
    assert entries[key("evening")]["hourly"] is not None


def test_parse_forecast_nulls_a_factor_whose_columns_are_all_null():
    # Cycling is unaffected by tide, water quality and underwater visibility.
    entry = parse(build_response(days=1), activity="cycling")[key(activity="cycling")]
    assert entry["tide"] is None
    assert entry["water"] is None
    assert entry["visibility"] is None


def test_parse_forecast_passes_a_factor_object_through():
    entry = parse(build_response(days=1))[key()]
    assert entry["wind"] == {
        "speed": "8km/h",
        "gust": "12km/h",
        "direction": "NE",
        "condition": "ideal",
        "summary": "Light breeze.",
    }
    assert entry["summary"] == "Easy paddling."
    assert entry["analysis"] == "Calm all day."


@pytest.mark.parametrize("activity, field", [
    ("sup", "sunset"),
    ("cycling", "civilTwilightEnd"),
])
def test_parse_forecast_keeps_the_daylight_time_as_written(activity, field):
    response = build_response(days=1, entry=build_entry(
        daylight={field: "20:22", "condition": "ideal"},
    ))
    entries = parse(response, activity=activity)
    assert entries[key(activity=activity)]["daylight"] == {field: "20:22", "condition": "ideal"}


def test_parse_forecast_keeps_a_factor_the_scorer_left_partly_empty():
    # Past the marine range there is no sea temperature, so the field is absent.
    response = build_response(days=1, entry=build_entry(temp={
        "air": "14°C",
        "feelsLike": "13°C",
        "condition": "marginal",
        "summary": "Cool.",
    }))
    assert parse(response)[key()]["temp"] == {
        "air": "14°C",
        "feelsLike": "13°C",
        "condition": "marginal",
        "summary": "Cool.",
    }


@pytest.mark.parametrize("score, condition", [
    (100, "ideal"),
    (80, "ideal"),
    (79, "acceptable"),
    (60, "acceptable"),
    (59, "marginal"),
    (40, "marginal"),
    (39, "unsuitable"),
    (0, "unsuitable"),
])
def test_condition_for_maps_each_band(score, condition):
    assert condition_for(score) == condition


def test_condition_for_without_a_score():
    assert condition_for(None) is None
