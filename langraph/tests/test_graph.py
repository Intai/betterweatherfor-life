import pytest

from langraph.app.graph import FETCH_NODES, SCORE_NODES, build_fetch_graph, build_graph


def test_fetch_nodes_has_five_entries():
    assert len(FETCH_NODES) == 5
    expected = {"water_quality", "tides", "weather", "marine", "sun_times"}
    assert set(FETCH_NODES.keys()) == expected


def test_build_fetch_graph():
    graph = build_fetch_graph("water_quality")
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names == {"__start__", "water_quality", "__end__"}


def test_build_fetch_graph_marine():
    graph = build_fetch_graph("marine")
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names == {"__start__", "marine", "__end__"}


def test_build_fetch_graph_invalid_key():
    with pytest.raises(KeyError):
        build_fetch_graph("nonexistent")


def test_build_graph():
    graph = build_graph()
    node_names = set(graph.get_graph().nodes.keys())
    assert node_names == {
        "__start__",
        "water_quality", "tides",
        "weather", "marine", "sun_times",
        "score_sup", "score_kayaking", "score_snorkelling", "score_cycling",
        "__end__",
    }


def test_build_graph_has_no_swell_node():
    graph = build_graph()
    assert "swell" not in graph.get_graph().nodes


def test_score_nodes_registered():
    assert set(SCORE_NODES) == {
        "score_sup",
        "score_kayaking",
        "score_snorkelling",
        "score_cycling",
    }
