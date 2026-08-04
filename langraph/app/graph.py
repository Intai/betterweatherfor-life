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

SCORE_NODES = {
    "score_sup": score_sup,
    "score_kayaking": score_kayaking,
    "score_snorkelling": score_snorkelling,
    "score_cycling": score_cycling,
}


def build_fetch_graph(fetch_name):
    """Build a minimal graph with a single fetch node for testing."""
    builder = StateGraph(ForecastState)
    builder.add_node(fetch_name, FETCH_NODES[fetch_name])
    builder.add_edge(START, fetch_name)
    builder.add_edge(fetch_name, END)
    return builder.compile()


def build_graph():
    """Build the forecast LangGraph with parallel fetch and score phases."""
    builder = StateGraph(ForecastState)

    # Phase 1: parallel data fetch nodes
    for node_name, node_fn in FETCH_NODES.items():
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
