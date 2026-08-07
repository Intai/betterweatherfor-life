from unittest.mock import MagicMock, patch

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


@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="marine_data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_build_fetch_graph_runs_the_model_it_was_given(mock_load, mock_agent,
                                                       minimal_state):
    # Invoked rather than merely built: binding the model wraps the node in a
    # closure, and only running it proves LangGraph accepts the arity.
    other = MagicMock()

    result = build_fetch_graph("marine", llm=other).invoke(minimal_state)

    assert result["marine"] == "marine_data"
    assert mock_agent.call_args[1]["llm"] is other


@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="marine_data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_build_fetch_graph_leaves_the_singleton_alone_by_default(mock_load, mock_agent,
                                                                 minimal_state):
    build_fetch_graph("marine").invoke(minimal_state)
    assert mock_agent.call_args[1]["llm"] is None


@patch("langraph.nodes.fetch_nodes.fetch_weather_rows", return_value="weather_data")
def test_build_fetch_graph_binds_a_model_a_pure_source_ignores(mock_rows, minimal_state):
    # Every node takes the same arguments so nothing has to know which use a
    # model; weather simply drops it.
    result = build_fetch_graph("weather", llm=MagicMock()).invoke(minimal_state)
    assert result["weather"] == "weather_data"


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
