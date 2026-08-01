import pytest

from langraph.app.graph import FETCH_NODES, build_fetch_graph, build_graph


def test_fetch_nodes_has_six_entries():
    assert len(FETCH_NODES) == 6
    expected = {"water_quality", "tides", "swell", "weather", "sea_temp", "sun_times"}
    assert set(FETCH_NODES.keys()) == expected


def test_build_fetch_graph():
    graph = build_fetch_graph("water_quality")
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names == {"__start__", "fetch_water_quality", "__end__"}


def test_build_fetch_graph_invalid_key():
    with pytest.raises(KeyError):
        build_fetch_graph("nonexistent")


def test_build_graph():
    graph = build_graph()
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names == {
        "__start__",
        "fetch_water_quality", "fetch_tides", "fetch_swell",
        "fetch_weather", "fetch_sea_temp", "fetch_sun_times",
        "score_sup", "score_kayaking", "score_snorkelling", "score_cycling",
        "__end__",
    }
