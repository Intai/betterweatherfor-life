import logging

from langgraph.graph import END, START, StateGraph

from langraph.app.state import ForecastState
from langraph.nodes.fetch_nodes import (
    fetch_marine,
    fetch_sun_times,
    fetch_tides,
    fetch_water_quality,
    fetch_weather,
)
from langraph.nodes.score_nodes import (
    score_cycling,
    score_kayaking,
    score_snorkelling,
    score_sup,
)

FETCH_NODES = {
    "water_quality": fetch_water_quality,
    "tides": fetch_tides,
    "weather": fetch_weather,
    "marine": fetch_marine,
    "sun_times": fetch_sun_times,
}

# Regional or sea-only data a location can legitimately lack: NIWA and SafeSwim
# cover New Zealand alone. Scoring leaves out a section it was not given, so a
# forecast without them is still worth writing. Weather and sun times are not on
# the list, because scores without them would be guesses.
OPTIONAL_SOURCES = frozenset({"tides", "water_quality", "marine"})

# Warnings go out through logging's handler of last resort, which is stderr —
# the same stream the traceback already travels to reach the container log.
logger = logging.getLogger(__name__)

SCORE_NODES = {
    "score_sup": score_sup,
    "score_kayaking": score_kayaking,
    "score_snorkelling": score_snorkelling,
    "score_cycling": score_cycling,
}


def build_fetch_graph(fetch_name, llm=None):
    """Build a minimal graph with a single fetch node for testing.

    Args:
        fetch_name: A key of FETCH_NODES.
        llm: A chat model for the node to use instead of the module singleton, so
            one process can compare several. The two sources fetched without an
            agent accept it and ignore it.

    Returns:
        A compiled graph running that one node.

    Raises:
        KeyError: If `fetch_name` is not a fetch node.
    """
    node = FETCH_NODES[fetch_name]
    builder = StateGraph(ForecastState)
    builder.add_node(fetch_name, (lambda state: node(state, llm=llm)) if llm else node)
    builder.add_edge(START, fetch_name)
    builder.add_edge(fetch_name, END)
    return builder.compile()


def _optional(fetch_name, node):
    """Wrap a fetch node so its failure leaves its source out instead of the run."""

    def tolerant(state):
        try:
            return node(state)
        except Exception as error:  # noqa: BLE001 — a missing source is not a failed forecast
            logger.warning(
                "Skipping %s for %s: %s", fetch_name, state["location_slug"], error
            )
            return {}

    return tolerant


def build_graph():
    """Build the forecast LangGraph with parallel fetch and score phases.

    A source in OPTIONAL_SOURCES that fails is logged and left out rather than
    failing the location. `build_fetch_graph` does not do this, so an eval still
    sees the failure.
    """
    builder = StateGraph(ForecastState)

    # Phase 1: parallel data fetch nodes
    for node_name, node_fn in FETCH_NODES.items():
        if node_name in OPTIONAL_SOURCES:
            node_fn = _optional(node_name, node_fn)
        builder.add_node(node_name, node_fn)
        builder.add_edge(START, node_name)

    # Phase 2: parallel scoring nodes
    for node_name, node_fn in SCORE_NODES.items():
        builder.add_node(node_name, node_fn)
        builder.add_edge(node_name, END)

    # Fan-in: every fetch node feeds every score node
    for fetch_node in FETCH_NODES:
        for score_node in SCORE_NODES:
            builder.add_edge(fetch_node, score_node)

    return builder.compile()
