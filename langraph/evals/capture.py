"""Recording a real fetch phase into a committed seed.

Capture is a human-reviewed step rather than an automated one: seed quality is
the ceiling on every score experiment, so each source prints a digest to be
eyeballed — a tide series silently left in UTC looks perfectly well-formed, and
only the times themselves give it away.
"""

import json

from langraph.evals.config import FETCH_SOURCES, STATE_INPUTS
from langraph.evals.seeds import read_seed, seed_path


def digest(columnar):
    """Summarise one columnar fetch answer for review.

    Args:
        columnar: The `{"fields": [...], "rows": [...]}` string a source returned.

    Returns:
        A one-line summary naming the fields, the row count and the first and
        last value of the leading column, which is a time on every source.
    """
    try:
        data = json.loads(columnar)
        fields, rows = data["fields"], data["rows"]
    except (TypeError, KeyError, json.JSONDecodeError) as error:
        return f"unreadable: {error}"

    span = f"{rows[0][0]} .. {rows[-1][0]}" if rows else "no rows"
    return f"{len(rows)} rows, {span}, fields {', '.join(fields)}"


def fetch_source(state, source):
    """Fetch one source through the graph's own single-node path.

    Args:
        state: The location keys to fetch for.
        source: A key of `graph.FETCH_NODES`.

    Returns:
        The columnar string that source answered with.
    """
    from langraph.app.graph import build_fetch_graph

    return build_fetch_graph(source).invoke(state).get(source, "")


def capture_seed(inputs, sources=FETCH_SOURCES, existing=None, report=print):
    """Fetch each source in turn and build a seed record.

    Sequentially rather than through the graph's fan-out, so one flaky agent run
    does not take the other four with it and the trace stays readable.

    Args:
        inputs: The five location keys to capture for.
        sources: The fetch keys to run, for re-capturing one bad source.
        existing: A seed to merge into, keeping the sources not being re-run.
        report: Where to write each source's digest.

    Returns:
        A seed record, ready for `seeds.write_seed`.
    """
    from langraph.models.fetch_llm import fetch_llm

    state = {key: inputs[key] for key in STATE_INPUTS}
    fetched = dict((existing or {}).get("fetch") or {})
    failures = {}

    for source in sources:
        try:
            fetched[source] = fetch_source(state, source)
            report(f"  {source}: {digest(fetched[source])}")
        except Exception as error:  # noqa: BLE001 — one bad source must not stop the rest
            failures[source] = f"{type(error).__name__}: {error}"
            report(f"  {source}: FAILED {failures[source]}")

    provenance = dict((existing or {}).get("provenance") or {})
    provenance.update({
        "fetch_model": getattr(fetch_llm, "model_name", None) or getattr(
            fetch_llm, "model", None
        ),
        "failures": failures or None,
    })
    return {"inputs": state, "fetch": fetched, "provenance": provenance}


def _child_outputs(run, wanted):
    """Collect the fetch outputs from a traced graph run's child runs."""
    found = {}
    for child in run.child_runs or []:
        if child.name in wanted and child.outputs:
            value = child.outputs.get(child.name)
            if value:
                found[child.name] = value
    return found


def capture_from_run(run_id, sources=FETCH_SOURCES, report=print):
    """Recover a seed from a past traced run instead of fetching again.

    Free and immediate, but it inherits whatever that day's fetch models got
    wrong and skips the review a fresh capture invites, so it is best used to
    find an interesting day and then re-capture it properly.

    Args:
        run_id: The root run of a past forecast graph run.
        sources: The fetch keys to recover.
        report: Where to write each recovered source's digest.

    Returns:
        A seed record.

    Raises:
        ValueError: If the run carries none of the requested sources, which is
            what a truncated ingest or a wrong run id looks like.
    """
    from langsmith import Client

    run = Client().read_run(run_id, load_child_runs=True)
    fetched = _child_outputs(run, set(sources))
    if not fetched:
        raise ValueError(f"Run {run_id} has no fetch outputs among {sorted(sources)}")

    for source, value in fetched.items():
        report(f"  {source}: {digest(value)}")

    inputs = {key: (run.inputs or {}).get(key, "") for key in STATE_INPUTS}
    return {
        "inputs": inputs,
        "fetch": fetched,
        "provenance": {"mined_from_run": str(run_id)},
    }


def load_existing(slug, date):
    """Read the seed a capture is adding to, or None when it is the first."""
    path = seed_path(slug, date)
    return read_seed(path) if path.exists() else None
