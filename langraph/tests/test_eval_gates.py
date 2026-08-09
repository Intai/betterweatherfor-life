"""Tests for which metrics decide pass or fail, and at what value.

Pure functions only. `gates.py` reads an experiment that has already finished, so
nothing here needs LangSmith, a model or the network.
"""

from types import SimpleNamespace

import pytest

from langraph.evals.gates import (
    CALIBRATED_PROMPT_SHA,
    FLOORS,
    HARD,
    USABLE_RUN_RATE_FLOOR,
    check,
    collect,
    gate,
    stale_calibration,
)


def results_for(**scores):
    """Build one row's `evaluation_results` from metric name to score."""
    return {"results": [SimpleNamespace(key=key, score=score)
                        for key, score in scores.items()]}


def row(meta=None, **scores):
    """Build an `ExperimentResultRow`-shaped mapping."""
    return {
        "run": SimpleNamespace(outputs={"_meta": {} if meta is None else meta}),
        "example": SimpleNamespace(id="example"),
        "evaluation_results": results_for(**scores),
    }


# Everything a score experiment gates, all at the good end.
CLEAN = {**dict.fromkeys(HARD, 1.0), **dict.fromkeys(FLOORS, 1.0)}

# What an end-to-end run actually reports: `graph_evaluators` registers a fraction
# of the per-node checks, so most of the tables go unmeasured.
GRAPH_KEYS = {
    "columnar_parseable": 1.0,
    "fields_exact": 1.0,
    "rows_ordered": 1.0,
    "band_consistency": 1.0,
    "null_discipline": 1.0,
}


# --- the tables --------------------------------------------------------------

def test_a_clean_experiment_has_nothing_to_report():
    failures, absent = check(collect([row(**CLEAN)]), rate=1.0)

    assert failures == []
    assert absent == []


@pytest.mark.parametrize("key", sorted(HARD))
def test_each_hard_key_fails_on_its_own(key):
    failures, _ = check(collect([row(**{**CLEAN, key: 0.0})]), rate=1.0)

    assert len(failures) == 1
    assert key in failures[0]


@pytest.mark.parametrize("key", sorted(FLOORS))
def test_each_floor_fails_just_below_and_passes_at_it(key):
    floor = FLOORS[key]

    below, _ = check(collect([row(**{**CLEAN, key: floor - 0.01})]), rate=1.0)
    at, _ = check(collect([row(**{**CLEAN, key: floor})]), rate=1.0)

    assert len(below) == 1
    assert key in below[0]
    assert at == []


def test_a_repeated_key_must_clear_the_bar_on_every_observation():
    # The end-to-end suite emits `columnar_parseable` once per source inside a
    # single row, so an average would hide four good sources carrying one broken.
    entry = row()
    entry["evaluation_results"] = {"results": [
        SimpleNamespace(key="columnar_parseable", score=1.0),
        SimpleNamespace(key="columnar_parseable", score=0.0),
    ]}

    failures, _ = check(collect([entry]), rate=1.0)

    assert any("columnar_parseable" in failure for failure in failures)


# --- what must not be gated --------------------------------------------------

def test_the_problem_count_is_not_gated_only_the_boolean_is():
    # `parse_problems` is the harness's one inverted metric, so a `>=` floor on it
    # would read as trivially true and gate nothing. `parse_clean` carries it.
    assert "parse_problems" not in HARD
    assert "parse_problems" not in FLOORS
    assert "parse_clean" in HARD

    failures, _ = check(
        collect([row(**{**CLEAN, "parse_clean": False}, parse_problems=4)]), rate=1.0
    )

    assert len(failures) == 1
    assert "parse_clean" in failures[0]


@pytest.mark.parametrize(("key", "observed"), [
    ("band_consistency", 0.975),
    ("hourly_entry_agreement", 0.975),
    ("factor_completeness", 0.996),
])
def test_the_worst_healthy_observation_still_passes(key, observed):
    # These are the lowest values 12 usable claude-cli runs produced. A floor at
    # 1.0 would fail them, which is how the first calibration got it wrong: n=2
    # happened to land on 1.0 twice. One band-edge slip in forty entries is 0.975,
    # not a regression.
    failures, _ = check(collect([row(**{**CLEAN, key: observed})]), rate=1.0)

    assert failures == []


def test_coverage_metrics_below_one_do_not_fail():
    # Measured on healthy runs: 33/34 hourly entries, 39/40 tide rows. Gating
    # these at 1.0 would fail every clean experiment.
    scores = collect([row(**CLEAN, hourly_coverage=0.9706, row_coverage=0.975)])

    failures, _ = check(scores, rate=1.0)

    assert failures == []


def test_none_scores_are_skipped_rather_than_read_as_zero():
    # Real cases: `value_ranges` on a source with no numeric columns, and
    # `golden_match` wherever no golden was captured.
    scores = collect([row(**{**CLEAN, "value_ranges": None, "golden_match": None})])

    failures, absent = check(scores, rate=1.0)

    assert failures == []
    assert sorted(absent) == ["golden_match", "value_ranges"]


def test_an_absent_gated_key_is_reported_not_failed():
    # Without this the gate would be unusable on the end-to-end suite.
    failures, absent = check(collect([row(**GRAPH_KEYS)]), rate=1.0)

    assert failures == []
    assert "golden_match" in absent
    assert "parse_clean" in absent
    assert "value_ranges" in absent
    assert "columnar_parseable" not in absent


# --- the rate precondition ---------------------------------------------------

def test_a_rate_below_the_floor_fails_and_at_the_floor_passes():
    below, _ = check({}, rate=USABLE_RUN_RATE_FLOOR - 0.1)
    at, _ = check({}, rate=USABLE_RUN_RATE_FLOOR)

    assert any("usable_run_rate" in failure for failure in below)
    assert not any("usable_run_rate" in failure for failure in at)


def test_an_experiment_with_no_runs_fails():
    failures, _ = check({}, rate=None)

    assert any("usable_run_rate" in failure for failure in failures)


def test_a_failed_score_run_is_caught_by_the_rate_not_the_tables():
    # The reason the rate is a precondition rather than a peer threshold. On
    # exception `score_target` returns `forecast: {}` and `problems: []`, so
    # `parse_clean` reads True and every ratio collapses to None — the tables see
    # a perfect scorecard for a run that produced nothing.
    scores = collect([row(
        meta={"error": "RuntimeError: boom"},
        parse_clean=True, band_consistency=None, null_discipline=None,
        entry_coverage=0.0,
    )])

    assert check(scores, rate=1.0)[0] == [], "tables alone would pass this run"

    failures, _ = check(scores, rate=0.0)
    assert any("usable_run_rate" in failure for failure in failures)


# --- calibration drift -------------------------------------------------------

def test_the_calibrated_prompt_raises_no_warning():
    assert stale_calibration(CALIBRATED_PROMPT_SHA) is None
    assert stale_calibration(None) is None


def test_a_different_prompt_warns_about_the_floors():
    warning = stale_calibration("deadbeef1234")

    assert "deadbeef1234" in warning
    assert CALIBRATED_PROMPT_SHA in warning


# --- the whole decision ------------------------------------------------------

def test_gate_passes_a_clean_experiment_and_says_so():
    lines = []

    failed = gate([row(**CLEAN)], report=lines.append)

    assert failed is False
    assert any("passed" in line for line in lines)


def test_gate_fails_and_names_the_metric():
    lines = []

    failed = gate([row(**{**CLEAN, "columnar_parseable": 0.0})], report=lines.append)

    assert failed is True
    assert any("columnar_parseable" in line for line in lines)


def test_gate_reads_the_rate_off_the_runs():
    # `_meta.truncated` is set only by the score target, and either it or an error
    # makes a run unusable.
    lines = []

    failed = gate([row(meta={"truncated": "max_tokens"}, **CLEAN)],
                  report=lines.append)

    assert failed is True
    assert any("usable_run_rate" in line for line in lines)


def test_gate_warns_on_a_drifted_prompt_without_failing():
    lines = []

    failed = gate([row(**CLEAN)], prompt_sha="deadbeef1234", report=lines.append)

    assert failed is False
    assert any("warning" in line for line in lines)
