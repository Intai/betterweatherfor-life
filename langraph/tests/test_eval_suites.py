"""Tests for what a whole experiment reports.

`suites.py` decides which checks each experiment runs, and `summaries.py` reports
the metrics that only exist across a whole experiment rather than for one run —
both are about the shape of the run rather than about any one metric.
"""

import pytest

from langraph.evals.evaluators.fetch import EXPECTED_FIELDS
from langraph.evals.evaluators.suites import (
    fetch_evaluators,
    graph_evaluators,
    score_evaluators,
)
from langraph.evals.evaluators.summaries import (
    cost_profile,
    full_coverage_rate,
    usable_run_rate,
)
from langraph.tests.eval_builders import DATE, INPUTS, columnar, find, forecast

# --- summary evaluators -----------------------------------------------------

class FakeRun:
    def __init__(self, **meta):
        forecast_size = meta.pop("entries", 0)
        self.outputs = {
            "forecast": {str(index): {} for index in range(forecast_size)},
            "_meta": meta,
        }


def test_usable_run_rate_counts_out_truncated_and_failed_runs():
    runs = [FakeRun(), FakeRun(truncated="length"), FakeRun(error="boom"), FakeRun()]
    result = usable_run_rate(runs, [])
    assert result["score"] == 0.5
    assert "2/4 runs usable" in result["comment"]


def test_full_coverage_rate_counts_runs_that_returned_everything():
    runs = [FakeRun(entries=40, entry_count=40), FakeRun(entries=4, entry_count=40)]
    assert full_coverage_rate(runs, [])["score"] == 0.5


def test_cost_profile_takes_medians_so_one_outlier_cannot_decide_it():
    runs = [
        FakeRun(seconds=100, output_tokens=20000, reasoning_tokens=6000),
        FakeRun(seconds=110, output_tokens=21000, reasoning_tokens=7000),
        FakeRun(seconds=900, output_tokens=90000, reasoning_tokens=80000),
    ]
    result = cost_profile(runs, [])
    assert find(result, "median_seconds")["score"] == 110
    assert find(result, "median_output_tokens")["score"] == 21000


# --- wiring -----------------------------------------------------------------

def test_fetch_evaluators_only_add_a_golden_where_one_exists():
    assert any(e.__name__ == "golden_match" for e in fetch_evaluators("tides"))
    assert not any(e.__name__ == "golden_match" for e in fetch_evaluators("marine"))


@pytest.mark.parametrize(("source", "expected"), [
    ("sun_times", "solar_times_local"),
    ("tides", "tide_series_plausible"),
])
def test_fetch_evaluators_add_each_check_only_to_its_own_source(source, expected):
    assert any(e.__name__ == expected for e in fetch_evaluators(source))
    for other in ("marine", "weather", "water_quality"):
        assert not any(e.__name__ == expected for e in fetch_evaluators(other))


@pytest.mark.parametrize("source", list(EXPECTED_FIELDS))
def test_no_source_carries_an_evaluator_that_reports_nothing(source):
    # `local_time_sanity` used to be registered for every agent-fetched source,
    # but returned no metrics at all for marine — a column that could never
    # appear, and nothing to say so.
    rows = [[f"{DATE}T06:00", *([0] * (len(EXPECTED_FIELDS[source]) - 1))]]
    outputs = {source: columnar(EXPECTED_FIELDS[source], rows), "_meta": {}}

    for evaluator in fetch_evaluators(source):
        result = evaluator(INPUTS, outputs, None)
        reported = result.get("results", [result])
        assert reported, f"{evaluator.__name__} reports nothing for {source}"


def test_graph_evaluators_read_each_activity_out_of_the_final_state():
    evaluators = graph_evaluators(["sup"])
    band = next(e for e in evaluators if e.__name__ == "sup.band_consistency")

    state = {**INPUTS, "sup_forecast": forecast(days=1, score=90,
                                                factors={"wind": {"condition": "marginal"}})}

    assert band(INPUTS, state, None)["score"] == 0.0


def test_graph_evaluators_read_their_own_activity_and_not_another():
    # Each adapter derives its own state key, so a clean sup answer and a
    # contradictory cycling one in the same run must score independently.
    evaluators = graph_evaluators(["sup", "cycling"])
    state = {
        **INPUTS,
        "sup_forecast": forecast(days=1, score=50,
                                 factors={"wind": {"condition": "marginal"}}),
        "cycling_forecast": forecast(days=1, activity="cycling", score=90,
                                     factors={"wind": {"condition": "marginal"}}),
    }

    def band(activity):
        evaluator = next(e for e in evaluators
                         if e.__name__ == f"{activity}.band_consistency")
        return evaluator(INPUTS, state, None)["score"]

    assert band("sup") == 1.0
    assert band("cycling") == 0.0


def test_graph_evaluators_tolerate_an_activity_that_never_produced_a_forecast():
    # `graph_target` swallows a failed score node into `_meta.error`, so the
    # state simply lacks that key rather than carrying an empty one.
    evaluators = graph_evaluators(["sup"])
    coverage_of = next(e for e in evaluators if e.__name__ == "sup.entry_coverage")

    result = coverage_of(INPUTS, {**INPUTS, "_meta": {"error": "boom"}}, None)

    assert find(result, "entry_coverage")["score"] == 0.0


def test_every_suite_is_a_function_returning_a_fresh_list():
    # `cli.py` appends the judges to the score set, which would otherwise leak
    # into the next experiment run in the same process.
    first, second = score_evaluators(), score_evaluators()
    first.append("judge")
    assert "judge" not in second
    assert len(second) == len(first) - 1


def test_importing_a_catalogue_does_not_load_the_others():
    # The reason the assembly lives in `suites.py` rather than the package
    # `__init__`: a score evaluator has no business loading the fetch catalogue
    # and, through it, the SafeSwim and Google Weather HTTP modules. The shared
    # test builders are held to the same rule, so a score test importing them
    # stays as free of the fetch catalogue as the catalogue itself is.
    import subprocess
    import sys

    probe = (
        "import langraph.evals.evaluators.score, langraph.tests.eval_builders, sys; "
        "print(','.join(sorted(m for m in sys.modules "
        "if 'evaluators.fetch' in m or 'langraph.sources' in m)))"
    )
    result = subprocess.run(
        [sys.executable, "-c", probe], capture_output=True, text=True, check=True,
    )

    assert result.stdout.strip() == ""
