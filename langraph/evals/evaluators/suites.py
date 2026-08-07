"""Which checks each experiment runs.

The catalogues next door say what *can* be checked; this says what a given suite
actually reports. Keeping the two apart is what lets the score catalogue be
imported without dragging in the fetch one and its HTTP source modules.

All three are functions returning a fresh list, so a caller can append to what it
is given — `cli.py` adds the judges to the score set — without editing a shared
module-level object that the next experiment in the same process would inherit.
"""

from langraph.evals.config import FETCH_SOURCES, GOLDEN_TOLERANCE_MINUTES
from langraph.evals.evaluators import fetch, score
from langraph.evals.evaluators.common import bind, call_with, run_health


def score_evaluators():
    """Assemble the evaluators every score experiment runs."""
    return [
        bind(score.entry_coverage, "entry_coverage"),
        bind(score.problem_count, "parse_problems"),
        bind(score.factor_completeness, "factor_completeness"),
        bind(score.null_discipline, "null_discipline"),
        bind(score.band_consistency, "band_consistency"),
        bind(score.hourly_coverage, "hourly_coverage"),
        bind(score.hourly_entry_agreement, "hourly_entry_agreement"),
        bind(score.window_coherence, "window_coherence"),
        bind(score.summary_discipline, "summary_discipline"),
        bind(score.sources_were_given, "seed_sources_given"),
        bind(run_health, "run_health"),
    ]


def fetch_evaluators(source):
    """Assemble the evaluators for one fetch source.

    Every check is registered only where it applies, so no source carries an
    evaluator that can never report anything, and none appears to pass a
    correctness check it never ran.
    """
    evaluators = [
        bind(fetch.columnar_contract, "columnar_contract", source=source),
        bind(fetch.coverage, "coverage", source=source),
        bind(fetch.value_ranges, "value_ranges", source=source),
        bind(run_health, "run_health"),
    ]
    if source == "weather":
        evaluators.append(bind(fetch.wind_gusts_consistent, "wind_gusts_consistent"))
        evaluators.append(bind(fetch.wind_directions_known, "wind_directions_known"))
    if source == "sun_times":
        evaluators.append(bind(fetch.solar_times_local, "solar_times_local"))
    if source == "tides":
        evaluators.append(bind(fetch.tide_series_plausible, "tide_series_plausible"))
    if source in GOLDEN_TOLERANCE_MINUTES:
        evaluators.append(bind(
            fetch.golden_match, "golden_match",
            source=source, tolerance_minutes=GOLDEN_TOLERANCE_MINUTES[source],
        ))
    return evaluators


def graph_evaluators(activities):
    """Assemble the end-to-end set by re-keying the per-node evaluators.

    The graph's final state carries every fetch string and all four forecasts, so
    nothing new has to be written — each evaluator is pointed at its slice of the
    state and its metric renamed so the columns stay distinguishable.
    """
    evaluators = [bind(run_health, "run_health")]

    for source in FETCH_SOURCES:
        evaluators.append(
            bind(fetch.columnar_contract, f"{source}.columnar_contract", source=source)
        )
        evaluators.append(bind(fetch.coverage, f"{source}.coverage", source=source))

    for activity in activities:
        for evaluator, name in (
            (score.entry_coverage, "entry_coverage"),
            (score.band_consistency, "band_consistency"),
            (score.null_discipline, "null_discipline"),
        ):
            evaluators.append(
                bind(_for_activity(evaluator, activity), f"{activity}.{name}")
            )
    return evaluators


def _for_activity(evaluator, activity):
    """Re-point a score evaluator at one activity inside a whole graph run.

    A score experiment's target returns the one forecast it produced, which is
    the shape the score catalogue is written against. The graph's target returns
    the entire ForecastState, holding all four forecasts under
    `<activity>_forecast` and naming no activity of its own, so the slice for one
    activity is repackaged into that shape.

    Args:
        evaluator: A score catalogue entry.
        activity: The activity whose forecast it should read, which also names
            the state key, so the two cannot disagree.

    Returns:
        A callable taking `(inputs, outputs)` over a graph state.
    """

    def adapted(inputs, outputs):
        # Missing rather than empty when that score node raised: `graph_target`
        # reports the failure in `_meta` and the state simply lacks the key.
        forecast = (outputs or {}).get(f"{activity}_forecast")
        return call_with(
            evaluator,
            inputs={**inputs, "activity": activity},
            outputs={"forecast": forecast or {}, "_meta": {"activity": activity}},
        )

    adapted.__doc__ = evaluator.__doc__
    return adapted
