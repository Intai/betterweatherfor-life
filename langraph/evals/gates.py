"""Which metrics decide pass or fail, and at what value.

The evaluators next door stay pure reporters — they say what a run scored, never
whether that is good enough. Policy lives here so there is one place to read, and
one place a threshold can be changed with a commit message explaining why.

Two tables rather than one, because they mean different things. A `HARD` miss is a
contract breach: the value was knowable before any experiment ran, so anything else
is a bug. A `FLOORS` miss is a regression against a number that was *measured*, so
it is only as good as the calibration behind it and is the table expected to grow
non-1.0 entries as other models get characterised.

Nothing here is passed in from the command line. `cli.py` decides only whether to
enforce, never what to enforce — a threshold typed into a shell is invisible to
review and unreproducible next week.
"""

from langraph.evals.evaluators.summaries import usable_run_rate

# The floors below were read off claude-cli at this score prompt: 12 usable runs
# over four activities at `--repetitions 3`, plus one experiment per fetch source.
# A metric that moves after `prompts/score.txt` changes may be the prompt rather
# than the model, so the gate says so instead of quietly blaming the model.
CALIBRATED_PROMPT_SHA = "510a666c050d"

# Every run must be usable. Lower it only with a committed reason: `--repetitions 3`
# over four examples makes one flaky provider call 0.9167, and the honest responses
# are to re-run or to write down why a tolerance is acceptable.
USABLE_RUN_RATE_FLOOR = 1.0

# Correct value known before the run. Schema, dataset integrity, and the two golden
# comparisons whose minute tolerance is already applied inside `golden_match`.
HARD = {
    "seed_sources_given": 1.0,
    "columnar_parseable": 1.0,
    "fields_exact": 1.0,
    "golden_match": 1.0,
    "parse_clean": 1.0,
}

# Rule conformance over live model output. A floor sits *below* the worst healthy
# observation, not at the median: a gate level with the median fails half the time
# by construction. `temperature=0` is not determinism for a reasoning model, and
# these metrics divide by entry counts, so one band-edge slip in forty entries is
# 0.975 rather than a rounding error.
FLOORS = {
    # Observed min 0.975 (one entry in forty), on cycling and snorkelling.
    "band_consistency": 0.95,
    # Observed min 0.975, on cycling.
    "hourly_entry_agreement": 0.95,
    # Observed min 0.996 — one missing factor among a few hundred slots, on sup.
    "factor_completeness": 0.99,
    # Flat 1.0 across all 12 runs.
    "null_discipline": 1.0,
    "window_coherence": 1.0,
    "prose_present": 1.0,
    "analysis_paragraphs": 1.0,
    # Fetch-side, and these stay at 1.0 on purpose. Holding the line here is what
    # found a real bug rather than a threshold to relax. The point stands either
    # way: a band-edge slip moves one entry in forty, while this misplaced the 
    # whole series. Lowering these floors would have hidden it.
    "rows_ordered": 1.0,
    "tides_alternate": 1.0,
    "tide_gaps_plausible": 1.0,
    "solar_times_local": 1.0,
    "value_ranges": 1.0,
    "wind_gusts_consistent": 1.0,
    "wind_directions_known": 1.0,
}


def _summarise(values, limit=3):
    """Name the worst few offending values without printing a hundred of them."""
    shown = ", ".join(
        f"{value:g}" if isinstance(value, float) else str(value)
        for value in sorted(values)[:limit]
    )
    extra = len(values) - limit
    return f"{shown} (+{extra} more)" if extra > 0 else shown


def collect(rows):
    """Gather every feedback score an experiment produced, keyed by metric.

    A metric appears once per row, and several times per row on the end-to-end
    suite: `graph_evaluators` renames the *evaluator* per source but the keys it
    emits stay `columnar_parseable` and `fields_exact` for all five. Keeping a list
    per key is what lets the gate demand that every observation clears the bar
    rather than only their average.

    `None` scores are dropped, because the harness spends `None` on "does not
    apply" — `value_ranges` on a source with no numeric columns, `golden_match`
    where no golden exists. Reading those as 0.0 would fail clean runs.

    Args:
        rows: `ExperimentResultRow` mappings, as `evaluate()` yields them.

    Returns:
        A dict of metric key to the list of scores observed for it.
    """
    scores = {}
    for row in rows:
        results = (row.get("evaluation_results") or {}).get("results") or []
        for result in results:
            score = getattr(result, "score", None)
            if score is None:
                continue
            scores.setdefault(result.key, []).append(score)
    return scores


def stale_calibration(prompt_sha):
    """Describe a score prompt the floors were not measured against, or None."""
    if not prompt_sha or prompt_sha == CALIBRATED_PROMPT_SHA:
        return None
    return (
        f"score prompt is {prompt_sha} but the floors were calibrated against "
        f"{CALIBRATED_PROMPT_SHA}; a Tier 2 regression may be the prompt, not the model"
    )


def check(scores, rate):
    """Decide what failed, and which gated metrics this suite never reported.

    The rate is checked first because it is the only thing standing between a
    wholly failed experiment and a perfect scorecard. A score target that raises
    returns `forecast: {}` and `problems: []`, which reads as `parse_clean` True and
    turns every ratio into `None` — so `HARD` and `FLOORS` both pass on a run that
    produced nothing at all.

    An unreported metric is not a failure. Checks are registered only where they
    apply, so `golden_match` is missing for three of five sources and most of this
    module's keys are missing from an end-to-end run. Returning them separately
    keeps a suite honest without making a typo in the tables gate nothing forever.

    Args:
        scores: The output of `collect`.
        rate: The experiment's `usable_run_rate`, or None if it had no runs.

    Returns:
        A `(failures, absent)` pair of lists, both of description strings.
    """
    failures, absent = [], []

    if rate is None:
        failures.append("usable_run_rate: the experiment produced no runs to read")
    elif rate < USABLE_RUN_RATE_FLOOR:
        failures.append(
            f"usable_run_rate {rate:g} is below {USABLE_RUN_RATE_FLOOR:g}; every "
            "metric below was measured only over the runs that survived"
        )

    for key, expected in HARD.items():
        observed = scores.get(key)
        if not observed:
            absent.append(key)
            continue
        wrong = [value for value in observed if value != expected]
        if wrong:
            failures.append(
                f"{key} must be {expected:g} on every run, got {_summarise(wrong)}"
            )

    for key, floor in FLOORS.items():
        observed = scores.get(key)
        if not observed:
            absent.append(key)
            continue
        below = [value for value in observed if value < floor]
        if below:
            failures.append(
                f"{key} fell below its calibrated floor {floor:g}: {_summarise(below)}"
            )

    return failures, absent


def gate(results, prompt_sha=None, report=print):
    """Read one experiment's results and say whether it failed the gate.

    Args:
        results: The `ExperimentResults` an `evaluate()` call returned.
        prompt_sha: The score prompt this experiment ran against, so a drifted
            calibration can be called out.
        report: Where to write the findings.

    Returns:
        True when something failed, so a command can turn that into an exit code.
    """
    rows = list(results)
    rate = usable_run_rate(
        [row["run"] for row in rows], [row["example"] for row in rows]
    )["score"]
    failures, absent = check(collect(rows), rate)

    drifted = stale_calibration(prompt_sha)
    if drifted:
        report(f"  warning: {drifted}")
    if absent:
        report(f"  not measured by this suite: {', '.join(sorted(absent))}")
    for failure in failures:
        report(f"  FAIL {failure}")
    report(f"  gate: {len(failures)} failure(s)" if failures else "  gate: passed")

    return bool(failures)
