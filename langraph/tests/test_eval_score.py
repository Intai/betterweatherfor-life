"""Tests for the score catalogue in `langraph.evals.evaluators.score`.

Safe to run under `tests/conftest.py` — everything here imports pure functions,
never a target and never a model. An evaluator with a bug reports a wrong number
quietly and forever, which is exactly the sort of thing no experiment would ever
surface.
"""

import pytest

from langraph.evals.evaluators.score import (
    band_consistency,
    entry_coverage,
    factor_completeness,
    hourly_coverage,
    hourly_entry_agreement,
    null_discipline,
    problem_count,
    sources_were_given,
    summary_discipline,
    window_coherence,
    worst_condition,
)
from langraph.tests.eval_builders import (
    DATE,
    INPUTS,
    entry,
    find,
    forecast,
    hourly_for,
    outputs_for,
)
from langraph.utils.score_parser import FORECAST_WINDOWS, forecast_dates

# --- coverage ---------------------------------------------------------------

def test_entry_coverage_counts_a_complete_answer():
    result = entry_coverage(INPUTS, outputs_for(forecast()))
    assert find(result, "entry_coverage")["score"] == 1.0
    assert find(result, "date_coverage")["score"] == 1.0


def test_entry_coverage_reports_a_scorer_that_stopped_early():
    # One run answered with the first day of ten, which is the failure this
    # metric exists to make visible.
    result = entry_coverage(INPUTS, outputs_for(forecast(days=1)))
    assert find(result, "entry_coverage")["score"] == pytest.approx(4 / 40)
    assert find(result, "date_coverage")["score"] == pytest.approx(1 / 10)
    assert "4/40 entries" in find(result, "entry_coverage")["comment"]


def test_entry_coverage_ignores_entries_with_no_score():
    built = forecast(days=1, score=None)
    result = entry_coverage(INPUTS, outputs_for(built))
    assert find(result, "entry_coverage")["score"] == pytest.approx(4 / 40)
    assert find(result, "scored_coverage")["score"] == 0.0


def test_problem_count_names_the_first_few():
    outputs = {"problems": ["bad a", "bad b", "bad c", "bad d"]}
    result = problem_count(outputs)
    assert find(result, "parse_problems")["score"] == 4
    assert find(result, "parse_clean")["score"] is False
    assert find(result, "parse_clean")["comment"] == "bad a; bad b; bad c"


def test_problem_count_reads_clean_when_nothing_was_dropped():
    # `parse_clean` exists so a gate never has to hold an inverted entry: 1.0 is
    # the good end here as everywhere else, while the count stays for reading.
    result = problem_count({"problems": []})
    assert find(result, "parse_clean")["score"] is True
    assert find(result, "parse_problems")["score"] == 0


# --- factor and null discipline ---------------------------------------------

def test_factor_completeness_is_full_when_every_factor_arrived():
    assert factor_completeness(INPUTS, outputs_for(forecast()))["score"] == 1.0


def test_factor_completeness_only_expects_water_while_safeswim_grades_it():
    # SafeSwim covers the start date and two more, and score.txt says to omit
    # `water` past that — a later date without it is right, not incomplete.
    built = forecast()
    for value in built.values():
        if value["date"] not in forecast_dates(DATE)[:3]:
            value["water"] = None

    assert factor_completeness(INPUTS, outputs_for(built))["score"] == 1.0


def test_factor_completeness_reports_a_factor_that_never_arrived():
    built = forecast(factors={"uv": None})
    result = factor_completeness(INPUTS, outputs_for(built))
    assert result["score"] < 1.0
    assert "uv" in result["comment"]


def test_null_discipline_catches_a_cycling_entry_carrying_a_tide():
    # Well-formed JSON the parser cannot object to, and exactly the mistake
    # score.txt spends three paragraphs on.
    built = forecast(activity="cycling")
    inputs = {**INPUTS, "activity": "cycling"}

    result = null_discipline(inputs, outputs_for(built, activity="cycling"))

    assert result["score"] == 0.0
    assert "tide" in result["comment"] and "water" in result["comment"]


def test_null_discipline_passes_a_clean_cycling_answer():
    built = forecast(activity="cycling",
                     factors={"tide": None, "water": None, "visibility": None,
                              "humidity": {"percentage": 55, "condition": "ideal"}})
    inputs = {**INPUTS, "activity": "cycling"}

    result = null_discipline(inputs, outputs_for(built, activity="cycling"))

    assert result["score"] == 1.0
    assert result.get("comment") is None


# --- the worst-factor rule --------------------------------------------------

def test_worst_condition_takes_the_worst_of_the_factors():
    built = entry(factors={"wind": {"condition": "marginal"}})
    assert worst_condition(built, "sup") == "marginal"


def test_worst_condition_exempts_snorkelling_temperature():
    # score.txt pins snorkelling's temp to acceptable and tells it never to
    # decide the score, so it cannot be the worst factor either.
    built = entry(activity="snorkelling", factors={"temp": {"condition": "acceptable"}})
    assert worst_condition(built, "snorkelling") == "ideal"
    assert worst_condition(built, "sup") == "acceptable"


def test_band_consistency_passes_when_the_score_matches_the_worst_factor():
    built = forecast(score=50, factors={"wind": {"condition": "marginal"}})
    assert band_consistency(INPUTS, outputs_for(built))["score"] == 1.0


def test_band_consistency_catches_a_score_above_its_worst_factor():
    # The contradiction the parser's own comments record: a marginal factor with
    # an ideal score.
    built = forecast(score=90, factors={"wind": {"condition": "marginal"}})

    result = band_consistency(INPUTS, outputs_for(built))

    assert result["score"] == 0.0
    assert "worst marginal" in result["comment"]


# --- hourly and window coherence --------------------------------------------

def test_hourly_coverage_is_full_for_complete_windows():
    assert hourly_coverage(outputs_for(forecast()))["score"] == 1.0


def test_hourly_coverage_reports_a_short_array():
    built = forecast(days=1, hourly=hourly_for("all-day")[:5])
    assert hourly_coverage(outputs_for(built))["score"] < 1.0


def test_hourly_entry_agreement_catches_a_score_above_every_hour():
    # Structurally impossible for the parser to catch: the windows are sliced
    # from one array, but the entry score is written separately.
    built = forecast(days=1, score=85, hourly=hourly_for("all-day", score=30))

    result = hourly_entry_agreement(outputs_for(built))

    assert result["score"] == 0.0
    assert "over hours 30-30" in result["comment"]


def test_window_coherence_catches_a_day_scored_above_all_its_parts():
    built = {}
    for window in FORECAST_WINDOWS:
        score = 95 if window == "all-day" else 40
        built[f"sup;{DATE};{window};x"] = entry(window=window, score=score)

    assert window_coherence(outputs_for(built))["score"] == 0.0


def test_window_coherence_passes_a_day_inside_its_parts():
    built = {}
    for window in FORECAST_WINDOWS:
        score = 60 if window == "all-day" else {"morning": 80, "afternoon": 60,
                                                "evening": 40}[window]
        built[f"sup;{DATE};{window};x"] = entry(window=window, score=score)

    assert window_coherence(outputs_for(built))["score"] == 1.0


# --- prose ------------------------------------------------------------------

def test_summary_discipline_accepts_a_well_written_entry():
    result = summary_discipline(outputs_for(forecast(days=1)))
    assert find(result, "prose_present")["score"] == 1.0
    assert find(result, "summary_specific")["score"] == 1.0
    assert find(result, "analysis_paragraphs")["score"] == 1.0
    assert find(result, "analysis_distinct")["score"] == 1.0


def test_summary_discipline_rejects_a_generic_summary():
    built = forecast(days=1, summary="Unsuitable conditions.")
    result = summary_discipline(outputs_for(built))
    assert find(result, "summary_specific")["score"] == 0.0


def test_summary_discipline_catches_an_analysis_restating_its_summary():
    # score.txt: analysis must stand alone but never open by repeating summary.
    line = "The 43km/h southwest wind is too strong for stable paddling."
    built = forecast(days=1, summary=line, analysis=f"{line}\n\nStay ashore today.")

    result = summary_discipline(outputs_for(built))

    assert find(result, "analysis_distinct")["score"] == 0.0


def test_summary_discipline_counts_a_one_paragraph_analysis_as_short():
    built = forecast(days=1, analysis="One paragraph only.")
    result = summary_discipline(outputs_for(built))
    assert find(result, "analysis_paragraphs")["score"] == 0.0


# --- the seed itself --------------------------------------------------------

def test_sources_were_given_reports_a_seed_missing_a_source():
    inputs = {**INPUTS, "weather": "{}", "tides": "", "water_quality": "",
              "marine": "", "sun_times": ""}

    result = sources_were_given(inputs, outputs_for(forecast(days=1)))

    assert result["score"] == pytest.approx(1 / 5)
    assert "tides" in result["comment"]


def test_sources_were_given_only_asks_for_what_the_activity_uses():
    inputs = {**INPUTS, "activity": "cycling", "weather": "{}", "sun_times": "{}"}
    outputs = outputs_for(forecast(days=1, activity="cycling"), activity="cycling")
    assert sources_were_given(inputs, outputs)["score"] == 1.0
