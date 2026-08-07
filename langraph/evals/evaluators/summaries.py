"""Metrics over a whole experiment rather than one example.

Single-example numbers are noise: `temperature=0` is not determinism for a
reasoning model, and routing, reasoning budgets and provider load all move an
answer. These are what a model decision should actually be read off, across
`--repetitions`.
"""

import statistics

from langraph.evals.evaluators.common import metric, metrics, ratio


def _metas(runs):
    return [(run.outputs or {}).get("_meta") or {} for run in runs]


def _forecasts(runs):
    return [(run.outputs or {}).get("forecast") or {} for run in runs]


def usable_run_rate(runs, examples):
    """Report the share of runs that neither failed nor were cut off.

    The gate on every other metric. Because targets report failures rather than
    raising, LangSmith shows every row as successful, so a model answering only
    half its examples looks fine until this column is read.
    """
    metas = _metas(runs)
    usable = sum(
        1 for values in metas
        if not values.get("error") and not values.get("truncated")
    )
    return metric("usable_run_rate", ratio(usable, len(metas)),
                  f"{usable}/{len(metas)} runs usable")


def full_coverage_rate(runs, examples):
    """Report the share of runs that returned every entry they were asked for."""
    pairs = list(zip(_forecasts(runs), _metas(runs), strict=True))
    full = sum(
        1 for forecast, values in pairs
        if values.get("entry_count") and len(forecast) >= values["entry_count"]
    )
    return metric("full_coverage_rate", ratio(full, len(pairs)),
                  f"{full}/{len(pairs)} runs returned every entry")


def cost_profile(runs, examples):
    """Report the median wall time and token spend across the experiment.

    Medians rather than means, because one slow or one runaway run would
    otherwise decide the comparison.
    """
    metas = _metas(runs)
    seconds = [values["seconds"] for values in metas if values.get("seconds")]
    output = [values["output_tokens"] for values in metas if values.get("output_tokens")]
    thinking = [
        values["reasoning_tokens"] / values["output_tokens"]
        for values in metas
        if values.get("reasoning_tokens") and values.get("output_tokens")
    ]
    return metrics(
        metric("median_seconds", statistics.median(seconds) if seconds else None),
        metric("median_output_tokens", statistics.median(output) if output else None),
        metric("median_thinking_share",
               statistics.median(thinking) if thinking else None),
    )


SCORE_SUMMARIES = (usable_run_rate, full_coverage_rate, cost_profile)
FETCH_SUMMARIES = (usable_run_rate, cost_profile)
