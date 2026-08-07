"""Shaping feedback, wiring evaluators up, and the metrics every suite reports.

Evaluators here take `(inputs, outputs, reference_outputs)` by keyword rather
than `(run, example)`: LangSmith resolves the arguments by name and both forms
work, but plain functions over plain dicts can be unit-tested without a client, a
network or a `Run` object. Nothing needs the run — the target already measured
what a run would have told us and passed it down in `_meta`.
"""

import inspect


def call_with(evaluator, **available):
    """Call an evaluator with whichever of these arguments it declares.

    Catalogue entries take only what they need — some `outputs` alone, some
    `inputs` as well — so every caller offers everything it has and lets the
    signature decide. This is that rule, in one place rather than restated at
    each layer that has to apply it.

    Args:
        evaluator: The function to call.
        **available: Everything on offer, of which it receives the subset it
            names.

    Returns:
        Whatever the evaluator returns.
    """
    accepted = set(inspect.signature(evaluator).parameters)
    return evaluator(**{
        key: value for key, value in available.items() if key in accepted
    })


def bind(evaluator, name, **bound):
    """Fix an evaluator's extra arguments and name the metric it reports.

    What lets one catalogue entry serve five sources or four activities: it fixes
    the arguments that vary and hands LangSmith a plain three-argument function,
    whose name becomes the metric group in the UI.

    Args:
        evaluator: A catalogue function taking any of `inputs`, `outputs`,
            `reference_outputs` plus arguments of its own.
        name: The evaluator name LangSmith groups the feedback under.
        **bound: The arguments to fix, e.g. `source="tides"`.

    Returns:
        A callable taking `(inputs, outputs, reference_outputs)`.
    """

    def wrapper(inputs, outputs, reference_outputs):
        return call_with(
            evaluator,
            inputs=inputs,
            outputs=outputs,
            reference_outputs=reference_outputs,
            **bound,
        )

    wrapper.__name__ = name
    wrapper.__doc__ = evaluator.__doc__
    return wrapper


def metric(key, score, comment=None):
    """Shape one feedback entry.

    Args:
        key: The metric name, as it appears as a column in LangSmith.
        score: A number, a bool, or None when the metric does not apply.
        comment: What the number means, shown alongside it.

    Returns:
        A feedback dict.
    """
    entry = {"key": key, "score": score}
    if comment:
        entry["comment"] = comment
    return entry


def metrics(*entries):
    """Report several metrics from one pass over the outputs."""
    return {"results": [entry for entry in entries if entry is not None]}


def ratio(part, whole):
    """Divide, reading an empty denominator as "does not apply" rather than zero."""
    return part / whole if whole else None


def meta(outputs):
    """Read the block the target measured, tolerating a run that produced none."""
    return (outputs or {}).get("_meta") or {}


def run_health(outputs):
    """Report what the call itself cost and whether it finished.

    Read these before any quality metric: because targets report their failures
    rather than raising, every row looks successful in LangSmith, and a strong
    average over the third of examples that returned is worse than a middling one
    over all of them.

    Named for the good outcome rather than the bad one, so every boolean and
    ratio this harness reports means the same thing — 1.0 is the good end. An
    `errored` column would read 1.0 when every run failed, sitting in the table
    beside a `band_consistency` of 1.0 that means the opposite.

    `thinking_share` is the quantity `models/score_llm.py` records in prose from
    hand-read traces — the whole point of putting it on an axis. It has no good
    direction, and neither do `seconds` or `output_tokens`; they are magnitudes
    to compare between experiments rather than scores to read on their own.
    """
    values = meta(outputs)
    output_tokens = values.get("output_tokens")
    reasoning = values.get("reasoning_tokens")
    return metrics(
        metric("succeeded", not values.get("error"), values.get("error")),
        metric("completed", not values.get("truncated"), values.get("truncated")),
        metric("seconds", values.get("seconds")),
        metric("output_tokens", output_tokens),
        metric(
            "thinking_share",
            ratio(reasoning, output_tokens) if reasoning is not None else None,
        ),
    )
