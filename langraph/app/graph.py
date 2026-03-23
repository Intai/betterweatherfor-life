from langgraph.graph import StateGraph, START, END

from langraph.app.state import ForecastState
from langraph.nodes.fetch_nodes import (
    fetch_water_quality,
    fetch_tides,
    fetch_swell,
    fetch_weather,
    fetch_sea_temp,
    fetch_sun_times,
)
from langraph.nodes.score_nodes import (
    score_sup,
    score_kayaking,
    score_snorkelling,
    score_cycling,
)


FETCH_NODES = {
    "water_quality": ("fetch_water_quality", fetch_water_quality),
    "tides": ("fetch_tides", fetch_tides),
    "swell": ("fetch_swell", fetch_swell),
    "weather": ("fetch_weather", fetch_weather),
    "sea_temp": ("fetch_sea_temp", fetch_sea_temp),
    "sun_times": ("fetch_sun_times", fetch_sun_times),
}


def build_fetch_graph(fetch_name):
    """Build a minimal graph with a single fetch node for testing."""
    node_name, node_fn = FETCH_NODES[fetch_name]
    builder = StateGraph(ForecastState)
    builder.add_node(node_name, node_fn)
    builder.add_edge(START, node_name)
    builder.add_edge(node_name, END)
    return builder.compile()


def build_graph():
    """Build the forecast LangGraph with parallel fetch and score phases."""
    builder = StateGraph(ForecastState)

    # Phase 1: 6 parallel data fetch nodes
    builder.add_node("fetch_water_quality", fetch_water_quality)
    builder.add_node("fetch_tides", fetch_tides)
    builder.add_node("fetch_swell", fetch_swell)
    builder.add_node("fetch_weather", fetch_weather)
    builder.add_node("fetch_sea_temp", fetch_sea_temp)
    builder.add_node("fetch_sun_times", fetch_sun_times)

    # Phase 2: 4 parallel scoring nodes
    builder.add_node("score_sup", score_sup)
    builder.add_node("score_kayaking", score_kayaking)
    builder.add_node("score_snorkelling", score_snorkelling)
    builder.add_node("score_cycling", score_cycling)

    # Fan-out from START to all 6 fetch nodes
    builder.add_edge(START, "fetch_water_quality")
    builder.add_edge(START, "fetch_tides")
    builder.add_edge(START, "fetch_swell")
    builder.add_edge(START, "fetch_weather")
    builder.add_edge(START, "fetch_sea_temp")
    builder.add_edge(START, "fetch_sun_times")

    # Fan-in: each fetch node feeds into all 4 score nodes
    fetch_nodes = [
        "fetch_water_quality",
        "fetch_tides",
        "fetch_swell",
        "fetch_weather",
        "fetch_sea_temp",
        "fetch_sun_times",
    ]
    score_nodes = [
        "score_sup",
        "score_kayaking",
        "score_snorkelling",
        "score_cycling",
    ]

    for fetch_node in fetch_nodes:
        for score_node in score_nodes:
            builder.add_edge(fetch_node, score_node)

    # Fan-in: all score nodes to END
    for score_node in score_nodes:
        builder.add_edge(score_node, END)

    return builder.compile()
