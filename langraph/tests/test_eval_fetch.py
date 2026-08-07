"""Tests for the fetch catalogue in `langraph.evals.evaluators.fetch`.

Safe to run under `tests/conftest.py` — everything here imports pure functions,
never a target and never a model. An evaluator with a bug reports a wrong number
quietly and forever, which is exactly the sort of thing no experiment would ever
surface.
"""

import pytest

from langraph.evals.evaluators.fetch import (
    COMPASS,
    EXPECTED_FIELDS,
    columnar_contract,
    coverage,
    golden_match,
    solar_times_local,
    tide_series_plausible,
    value_ranges,
    wind_directions_known,
    wind_gusts_consistent,
)
from langraph.prompts.loader import load_prompt
from langraph.sources.weather import _abbreviate
from langraph.tests.eval_builders import DATE, INPUTS, columnar, find
from langraph.utils.score_parser import forecast_dates


def test_columnar_contract_accepts_the_expected_fields():
    outputs = {"tides": columnar(EXPECTED_FIELDS["tides"], [])}
    result = columnar_contract(outputs, "tides")
    assert find(result, "columnar_parseable")["score"] is True
    assert find(result, "fields_exact")["score"] is True


def test_columnar_contract_reports_an_unreadable_answer():
    result = columnar_contract({"tides": "sorry, I could not fetch that"}, "tides")
    assert find(result, "columnar_parseable")["score"] is False


def test_columnar_contract_reports_a_renamed_field():
    outputs = {"marine": columnar(["time", "waterTemp", "tideSwell"], [])}
    result = columnar_contract(outputs, "marine")
    assert find(result, "fields_exact")["score"] is False
    assert "waterTemp" in find(result, "fields_exact")["comment"]


def test_coverage_counts_the_daytime_hours_of_the_whole_range():
    rows = [
        [f"{date}T{hour:02d}:00", 18.0, 0.5]
        for date in forecast_dates(DATE)
        for hour in range(6, 23)
    ]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}

    result = coverage(INPUTS, outputs, "marine")

    assert find(result, "row_coverage")["score"] == 1.0
    assert find(result, "rows_ordered")["score"] is True


def test_coverage_catches_a_duplicated_hour():
    # How an agent's invented hours show up: it repeats one and skips another,
    # which leaves the row count right and only the duplicate to give it away.
    rows = [[f"{DATE}T06:00", 18.0, 0.5], [f"{DATE}T06:00", 18.1, 0.5]]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}

    result = coverage(INPUTS, outputs, "marine")

    assert find(result, "rows_ordered")["score"] is False


def test_coverage_catches_hours_out_of_order():
    rows = [[f"{DATE}T07:00", 18.0, 0.5], [f"{DATE}T06:00", 18.1, 0.5]]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}

    result = coverage(INPUTS, outputs, "marine")

    assert find(result, "rows_ordered")["score"] is False


def test_coverage_accepts_ascending_distinct_hours():
    rows = [[f"{DATE}T0{hour}:00", 18.0, 0.5] for hour in (6, 7, 8)]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}

    result = coverage(INPUTS, outputs, "marine")

    assert find(result, "rows_ordered")["score"] is True


def test_value_ranges_catches_a_unit_confusion():
    # A sea temperature in Fahrenheit, alongside a swell height that is fine.
    rows = [[f"{DATE}T06:00", 180.0, 0.5]]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}

    result = value_ranges(outputs, "marine")

    assert result["score"] == 0.5
    assert "tempWater=180.0" in result["comment"]


def test_value_ranges_lets_nulls_pass():
    # The marine model runs out before the range does, and its final day is
    # legitimately empty.
    rows = [[f"{DATE}T06:00", None, None]]
    outputs = {"marine": columnar(EXPECTED_FIELDS["marine"], rows)}
    assert value_ranges(outputs, "marine")["score"] is None


def weather_rows(count=1, direction="NE", gust=30, speed=12, temp=20):
    """Build well-formed weather rows, varying only what a test is about."""
    values = {
        "time": f"{DATE}T06:00", "tempAir": temp, "tempFeelsLike": temp,
        "uvIndex": 4, "precipitationChance": 10, "precipitationAmount": 0.0,
        "windDirection": direction, "windSpeed": speed, "windGust": gust,
        "humidityPercentage": 60,
    }
    return [[values[field] for field in EXPECTED_FIELDS["weather"]]] * count


def weather(**kwargs):
    return {"weather": columnar(EXPECTED_FIELDS["weather"], weather_rows(**kwargs))}


def test_wind_gusts_consistent_catches_a_gust_below_its_own_wind_speed():
    # A gust is a peak of the wind it gusts from, so it can never be weaker.
    result = find(wind_gusts_consistent(weather(gust=12, speed=30)),
                  "wind_gusts_consistent")

    assert result["score"] == 0.0
    assert "gust 12 under speed 30" in result["comment"]


def test_wind_gusts_consistent_passes_an_ordinary_hour():
    assert find(wind_gusts_consistent(weather(gust=30, speed=12)),
                "wind_gusts_consistent")["score"] == 1.0


@pytest.mark.parametrize("direction", sorted(COMPASS))
def test_wind_directions_known_accepts_every_point_the_source_emits(direction):
    # ENE, ESE, WNW and WSW were rejected by a hand-rolled set, which made a
    # correct fetch look broken whenever the wind swung off a primary point.
    assert find(wind_directions_known(weather(direction=direction)),
                "wind_directions_known")["score"] == 1.0


@pytest.mark.parametrize("direction", ["NSE", "NSW", "SNE", "SNW", "NNNE", "up"])
def test_wind_directions_known_rejects_what_is_not_a_compass_point(direction):
    # The same hand-rolled set accepted NSE, NSW, SNE and SNW, which are not
    # points at all.
    assert find(wind_directions_known(weather(direction=direction)),
                "wind_directions_known")["score"] == 0.0


def test_the_compass_is_exactly_what_the_source_can_produce():
    # Pins COMPASS against `_abbreviate` so the two cannot drift apart again.
    names = [
        "NORTH", "NORTH_NORTHEAST", "NORTHEAST", "EAST_NORTHEAST",
        "EAST", "EAST_SOUTHEAST", "SOUTHEAST", "SOUTH_SOUTHEAST",
        "SOUTH", "SOUTH_SOUTHWEST", "SOUTHWEST", "WEST_SOUTHWEST",
        "WEST", "WEST_NORTHWEST", "NORTHWEST", "NORTH_NORTHWEST",
    ]
    assert COMPASS == {_abbreviate(name) for name in names}


def test_a_wholly_broken_column_scores_zero_rather_than_a_tenth_off():
    # Why these are three checks and not one: pooled counters put the envelope
    # check's eight comparisons an hour against these two's one each, so a
    # column that was 100% wrong used to read 0.900.
    broken = weather(direction="NNNE", gust=5, speed=40)

    assert find(wind_directions_known(broken), "wind_directions_known")["score"] == 0.0
    assert find(wind_gusts_consistent(broken), "wind_gusts_consistent")["score"] == 0.0
    # And the envelope check is untouched by either.
    assert value_ranges(broken, "weather")["score"] == 1.0


def test_the_wind_checks_are_untouched_by_a_value_out_of_range():
    hot = weather(temp=680)
    assert value_ranges(hot, "weather")["score"] < 1.0
    assert find(wind_gusts_consistent(hot), "wind_gusts_consistent")["score"] == 1.0
    assert find(wind_directions_known(hot), "wind_directions_known")["score"] == 1.0


def test_offenders_are_named_once_each_and_counted():
    # A systematic failure used to print the same value three times over.
    result = find(wind_directions_known(weather(count=170, direction="NNNE")),
                  "wind_directions_known")

    assert result["comment"] == "170/170 — 'NNNE'"


def test_solar_times_local_catches_sun_times_left_in_utc():
    # An unconverted answer is perfectly well-formed; only the hours give it away.
    rows = [[date, "18:14", "06:38", "07:05"] for date in forecast_dates(DATE)]
    outputs = {"sun_times": columnar(EXPECTED_FIELDS["sun_times"], rows)}

    result = solar_times_local(outputs)

    assert find(result, "solar_times_local")["score"] == 0.0


def test_solar_times_local_passes_local_sun_times():
    rows = [[date, "07:14", "19:38", "20:05"] for date in forecast_dates(DATE)]
    outputs = {"sun_times": columnar(EXPECTED_FIELDS["sun_times"], rows)}
    assert find(solar_times_local(outputs), "solar_times_local")["score"] == 1.0


def test_tide_series_plausible_catches_a_dropped_turning_point():
    # A missing turning point leaves two intervals back to back, ~12h24m, which
    # still alternates High/Low and still parses — only the gap gives it away.
    rows = [
        [f"{DATE}T04:12", "Low", 0.42],
        [f"{DATE}T10:30", "High", 3.18],
        [f"{DATE}T22:54", "High", 3.11],
    ]
    outputs = {"tides": columnar(EXPECTED_FIELDS["tides"], rows)}

    result = tide_series_plausible(outputs)

    assert find(result, "tide_gaps_plausible")["score"] == 0.5
    assert "1 gaps over 9h" in find(result, "tide_gaps_plausible")["comment"]


def test_tide_series_plausible_passes_an_ordinary_series():
    rows = [
        [f"{DATE}T04:12", "Low", 0.42],
        [f"{DATE}T10:30", "High", 3.18],
        [f"{DATE}T16:42", "Low", 0.38],
        [f"{DATE}T22:54", "High", 3.11],
    ]
    outputs = {"tides": columnar(EXPECTED_FIELDS["tides"], rows)}

    result = tide_series_plausible(outputs)

    assert find(result, "tides_alternate")["score"] == 1.0
    assert find(result, "tide_gaps_plausible")["score"] == 1.0


def test_tide_series_plausible_is_not_a_local_time_check():
    # Pins the docstring: shifting the whole series into UTC preserves both the
    # alternation and the spacing, so this passes it untouched. `golden_match`
    # is what catches that for tides, having a reference to compare against.
    local = [
        [f"{DATE}T04:12", "Low", 0.42],
        [f"{DATE}T10:30", "High", 3.18],
        [f"{DATE}T16:42", "Low", 0.38],
    ]
    shifted = [
        [f"{DATE}T17:12", "Low", 0.42],
        [f"{DATE}T23:30", "High", 3.18],
        ["2026-03-25T05:42", "Low", 0.38],
    ]

    def scores(rows):
        outputs = {"tides": columnar(EXPECTED_FIELDS["tides"], rows)}
        return {m["key"]: m["score"] for m in tide_series_plausible(outputs)["results"]}

    assert scores(shifted) == scores(local) == {"tides_alternate": 1.0,
                                                "tide_gaps_plausible": 1.0}


def test_golden_match_passes_within_tolerance():
    golden = columnar(EXPECTED_FIELDS["tides"], [[f"{DATE}T04:12", "Low", 0.42]])
    actual = columnar(EXPECTED_FIELDS["tides"], [[f"{DATE}T04:18", "Low", 0.42]])

    result = golden_match({"tides": actual}, {"tides": golden}, "tides", 10)

    assert result["score"] == 1.0


def test_golden_match_fails_an_answer_shifted_by_a_utc_offset():
    golden = columnar(EXPECTED_FIELDS["tides"], [[f"{DATE}T04:12", "Low", 0.42]])
    actual = columnar(EXPECTED_FIELDS["tides"], [[f"{DATE}T17:12", "Low", 0.42]])

    assert golden_match({"tides": actual}, {"tides": golden}, "tides", 10)["score"] == 0.0


def test_golden_match_reports_nothing_where_there_is_no_golden():
    # Weather is a live forecast, so a pass here would be a lie either way.
    result = golden_match({"marine": "{}"}, {}, "marine", 10)
    assert result["score"] is None


TIDE_GOLDEN = [[f"{DATE}T04:12", "Low", 0.42], [f"{DATE}T10:30", "High", 3.18]]
SOLAR_GOLDEN = [["2026-03-24", "07:14", "19:38", "20:05"],
                ["2026-03-25", "07:15", "19:36", "20:03"]]


def against_golden(source, rows, golden, tolerance):
    outputs = {source: columnar(EXPECTED_FIELDS[source], rows)}
    reference = {source: columnar(EXPECTED_FIELDS[source], golden)}
    return golden_match(outputs, reference, source, tolerance)


def test_golden_match_catches_every_solar_time_being_wrong():
    # The defect that motivated this: column 0 of sun_times is `date`, so
    # comparing it alone verified nothing about the times it exists to check.
    wrong = [["2026-03-24", "02:00", "23:59", "23:59"],
             ["2026-03-25", "02:00", "23:59", "23:59"]]

    assert against_golden("sun_times", wrong, SOLAR_GOLDEN, 2)["score"] == 0.0


def test_golden_match_accepts_a_solar_time_inside_the_tolerance():
    # A bare `HH:MM` has to read the same way a full timestamp does.
    close = [["2026-03-24", "07:15", "19:37", "20:05"],
             ["2026-03-25", "07:16", "19:35", "20:03"]]

    assert against_golden("sun_times", close, SOLAR_GOLDEN, 2)["score"] == 1.0


def test_golden_match_catches_a_flipped_tide_type():
    flipped = [[f"{DATE}T04:12", "High", 0.42], [f"{DATE}T10:30", "Low", 3.18]]
    assert against_golden("tides", flipped, TIDE_GOLDEN, 10)["score"] == 0.0


def test_golden_match_catches_a_wrong_tide_height():
    # Nothing else catches this: `value_ranges` only bounds heights to -1..12m.
    heavy = [[f"{DATE}T04:12", "Low", 9.9], [f"{DATE}T10:30", "High", 3.18]]
    assert against_golden("tides", heavy, TIDE_GOLDEN, 10)["score"] == 0.5


def test_golden_match_names_a_row_count_mismatch():
    # Otherwise a zero from one dropped row reads as every value being wrong.
    dropped = TIDE_GOLDEN[1:]

    result = against_golden("tides", dropped, TIDE_GOLDEN, 10)

    assert result["score"] == 0.0
    assert "got 1 rows, not 2" in result["comment"]


def test_golden_match_refuses_an_answer_with_different_fields():
    outputs = {"tides": columnar(["time", "kind", "heightM"], TIDE_GOLDEN)}
    reference = {"tides": columnar(EXPECTED_FIELDS["tides"], TIDE_GOLDEN)}

    result = golden_match(outputs, reference, "tides", 10)

    assert result["score"] == 0.0
    assert "fields differ" in result["comment"]


@pytest.mark.parametrize("source", ["tides", "marine", "sun_times"])
def test_expected_fields_still_match_the_prompt_that_asks_for_them(source):
    # The agent-fetched schemas live in the prompt text, so this is the guard
    # that keeps the evaluator's copy of them honest.
    prompt = load_prompt(
        f"fetch_{source}", latitude="0", longitude="0", date=DATE, timezone="UTC",
    )
    for field in EXPECTED_FIELDS[source]:
        assert f'"{field}"' in prompt
