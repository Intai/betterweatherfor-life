from unittest.mock import MagicMock, patch

import pytest

from langraph.nodes.fetch_nodes import (
    fetch_marine,
    fetch_sun_times,
    fetch_tides,
    fetch_water_quality,
    fetch_weather,
)


@patch("langraph.nodes.fetch_nodes.fetch_water_quality_rows", return_value="wq_data")
def test_fetch_water_quality(mock_rows, minimal_state):
    # No agent: the nearest beach is a nearest-neighbour search, and the grade
    # array has no timestamps for a model to reason about.
    result = fetch_water_quality(minimal_state)
    mock_rows.assert_called_once_with("-36.8485", "174.7633", "Pacific/Auckland")
    assert result == {"water_quality": "wq_data"}


@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="tide_data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_fetch_tides(mock_load, mock_agent, minimal_state):
    result = fetch_tides(minimal_state)
    mock_load.assert_called_once_with(
        "fetch_tides",
        latitude="-36.8485",
        longitude="174.7633",
        date="2026-03-24",
        timezone="Pacific/Auckland",
    )
    assert result == {"tides": "tide_data"}


@patch("langraph.nodes.fetch_nodes.fetch_weather_rows", return_value="weather_data")
def test_fetch_weather(mock_rows, minimal_state, monkeypatch):
    monkeypatch.setenv("GOOGLE_WEATHER_API_KEY", "test-key")
    result = fetch_weather(minimal_state)
    # No prompt and no agent: the timezone reaches the fetch directly, which is
    # what the agent never had and why its timestamps were twelve hours out.
    mock_rows.assert_called_once_with(
        "-36.8485", "174.7633", "Pacific/Auckland", "test-key"
    )
    assert result == {"weather": "weather_data"}


@patch("langraph.nodes.fetch_nodes.fetch_weather_rows", return_value="weather_data")
def test_fetch_weather_no_api_key(mock_rows, minimal_state, monkeypatch):
    monkeypatch.delenv("GOOGLE_WEATHER_API_KEY", raising=False)
    result = fetch_weather(minimal_state)
    mock_rows.assert_called_once_with("-36.8485", "174.7633", "Pacific/Auckland", "")
    assert result == {"weather": "weather_data"}


@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="marine_data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_fetch_marine(mock_load, mock_agent, minimal_state):
    result = fetch_marine(minimal_state)
    mock_load.assert_called_once_with(
        "fetch_marine",
        latitude="-36.8485",
        longitude="174.7633",
        date="2026-03-24",
    )
    assert result == {"marine": "marine_data"}


@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="sun_data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_fetch_sun_times(mock_load, mock_agent, minimal_state):
    result = fetch_sun_times(minimal_state)
    mock_load.assert_called_once_with(
        "fetch_sun_times",
        latitude="-36.8485",
        longitude="174.7633",
        date="2026-03-24",
        timezone="Pacific/Auckland",
    )
    assert result == {"sun_times": "sun_data"}


@pytest.mark.parametrize("node", [fetch_tides, fetch_marine, fetch_sun_times])
@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_agent_sources_fetch_with_the_model_they_are_given(mock_load, mock_agent,
                                                           minimal_state, node):
    # A sweep holds several models in one process, so the model cannot be read
    # from the environment at the point of the call.
    other = MagicMock()

    node(minimal_state, llm=other)

    assert mock_agent.call_args[1]["llm"] is other


@pytest.mark.parametrize("node", [fetch_tides, fetch_marine, fetch_sun_times])
@patch("langraph.nodes.fetch_nodes.run_fetch_agent", return_value="data")
@patch("langraph.nodes.fetch_nodes.load_prompt", return_value="prompt")
def test_agent_sources_default_to_the_singleton(mock_load, mock_agent, minimal_state,
                                                node):
    node(minimal_state)
    assert mock_agent.call_args[1]["llm"] is None


@pytest.mark.parametrize("node", [fetch_water_quality, fetch_weather])
def test_pure_sources_accept_a_model_and_ignore_it(node, minimal_state):
    # Uniform signatures across FETCH_NODES are what let `build_fetch_graph` bind
    # a model without knowing which sources use one.
    with patch(f"langraph.nodes.fetch_nodes.{node.__name__}_rows", return_value="data"):
        assert node(minimal_state, llm=MagicMock()) == {node.__name__[6:]: "data"}
