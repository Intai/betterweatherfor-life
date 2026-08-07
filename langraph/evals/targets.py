"""The callables `evaluate()` runs, one per node level.

Every target swallows its exceptions into `_meta.error` rather than raising. A
target that raises produces a row with no feedback at all, so a model failing a
third of its examples reads exactly like one that never fails — the difference
shows only in a run count nobody sorts by. Reporting the failure as a metric
gives it a column.

Everything an evaluator needs about the call itself is measured here and passed
down in `_meta`, rather than read off the `Run` afterwards. Evaluators fire as
soon as the target returns, while the child runs carrying token counts are still
being uploaded, so reading them there races the flush and intermittently finds
nothing.
"""

import time

from langraph.evals.config import FETCH_SOURCES, STATE_INPUTS


def _location(inputs):
    """Take the five state keys a graph needs out of an example's inputs."""
    return {key: inputs[key] for key in STATE_INPUTS}


def _usage(response):
    """Read the token counts off a reply, tolerating a provider that sends none."""
    usage = getattr(response, "usage_metadata", None) or {}
    details = usage.get("output_token_details") or {}
    return {
        "input_tokens": usage.get("input_tokens"),
        "output_tokens": usage.get("output_tokens"),
        "reasoning_tokens": details.get("reasoning"),
    }


def fetch_target(source, llm=None):
    """Build a target that runs one fetch node in isolation.

    Args:
        source: A key of `graph.FETCH_NODES`, e.g. `tides`.
        llm: A model from `build_fetch_llm`, or None for the module singleton.

    Returns:
        A callable taking example inputs and returning that source's answer.
    """
    from langraph.app.graph import build_fetch_graph

    graph = build_fetch_graph(source, llm=llm)

    def target(inputs):
        started = time.perf_counter()
        try:
            answer = graph.invoke(_location(inputs)).get(source, "")
            error = None
        except Exception as exc:  # noqa: BLE001 — a failed fetch is a datapoint
            answer, error = "", f"{type(exc).__name__}: {exc}"
        return {
            source: answer,
            "_meta": {
                "source": source,
                "error": error,
                "seconds": round(time.perf_counter() - started, 3),
            },
        }

    return target


def score_target(activity=None, llm=None):
    """Build a target that scores one activity from frozen fetch data.

    Args:
        activity: The activity to score, or None to read it from each example's
            inputs so one dataset covers all four.
        llm: A model from `build_score_llm`, or None for the module singleton.

    Returns:
        A callable taking example inputs and returning the forecast it built.
    """
    from langraph.nodes.score_nodes import score_activity

    def target(inputs):
        chosen = activity or inputs["activity"]
        state = {
            **_location(inputs),
            **{key: inputs.get(key, "") for key in FETCH_SOURCES},
        }
        started = time.perf_counter()
        attempt, error = None, None
        try:
            attempt = score_activity(state, chosen, llm=llm)
        except Exception as exc:  # noqa: BLE001 — an unusable answer is a datapoint
            error = f"{type(exc).__name__}: {exc}"

        return {
            "forecast": attempt.forecast if attempt else {},
            "problems": attempt.problems if attempt else [],
            "_meta": {
                "activity": chosen,
                "error": error,
                "truncated": attempt.truncated if attempt else None,
                "entry_count": attempt.entry_count if attempt else None,
                "seconds": round(time.perf_counter() - started, 3),
                **_usage(attempt.response if attempt else None),
            },
        }

    return target


def graph_target(max_concurrency=2):
    """Build a target that runs the whole forecast graph against live data.

    The final `ForecastState` carries every fetch string and all four forecasts,
    so the per-node evaluators run against it unchanged — no walking of child
    runs, which would race their upload and couple the evaluators to LangGraph's
    node names. Per-node timing comes from streaming the updates instead.

    Args:
        max_concurrency: The graph's own fan-out limit.

    Returns:
        A callable taking example inputs and returning the final state.
    """
    from langraph.app.graph import build_graph

    graph = build_graph()

    def target(inputs):
        state = _location(inputs)
        started = time.perf_counter()
        result, timings, error = {}, {}, None
        try:
            for update in graph.stream(
                state, {"max_concurrency": max_concurrency}, stream_mode="updates"
            ):
                for node, produced in update.items():
                    timings[node] = round(time.perf_counter() - started, 3)
                    result.update(produced or {})
        except Exception as exc:  # noqa: BLE001 — a broken run is the finding
            error = f"{type(exc).__name__}: {exc}"

        return {
            **state,
            **result,
            "_meta": {
                "error": error,
                "seconds": round(time.perf_counter() - started, 3),
                "node_seconds": timings,
            },
        }

    return target
