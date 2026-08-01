from unittest.mock import patch

from langraph.nodes.score_nodes import (
    _build_fetched_data,
    _score_activity,
    score_cycling,
    score_kayaking,
    score_snorkelling,
    score_sup,
)


def test_build_fetched_data_full(sample_state):
    result = _build_fetched_data(sample_state)
    assert "### Water Quality" in result
    assert "### Tides" in result
    assert "### Swell" in result
    assert "### Weather" in result
    assert "### Sea Surface Temperature" in result
    assert "### Sunrise/Sunset" in result
    assert '```json' in result


def test_build_fetched_data_empty(minimal_state):
    result = _build_fetched_data(minimal_state)
    assert result == ""


def test_build_fetched_data_partial(minimal_state):
    minimal_state["tides"] = '{"nextHigh": "10:30"}'
    minimal_state["weather"] = '{"temp": 22}'
    result = _build_fetched_data(minimal_state)
    expected = (
        '### Tides\n```json\n{"nextHigh": "10:30"}\n```'
        "\n\n"
        '### Weather\n```json\n{"temp": 22}\n```'
    )
    assert result == expected


@patch("langraph.nodes.score_nodes.run_score_agent", return_value=["msg1"])
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity(mock_load, mock_agent, sample_state):
    result = _score_activity(sample_state, "sup")
    mock_load.assert_called_once()
    call_kwargs = mock_load.call_args[1]
    assert call_kwargs["activity"] == "sup"
    assert call_kwargs["file_path"] == "mission-bay-sup.json"
    assert call_kwargs["latitude"] == "-36.8485"
    assert call_kwargs["longitude"] == "174.7633"
    assert call_kwargs["date"] == "2026-03-24"
    mock_agent.assert_called_once_with("score prompt")
    assert result == ["msg1"]


@patch("langraph.nodes.score_nodes._score_activity", return_value=["sup_msgs"])
def test_score_sup(mock_score, sample_state):
    result = score_sup(sample_state)
    mock_score.assert_called_once_with(sample_state, "sup")
    assert result == {"sup_forecast": ["sup_msgs"]}


@patch("langraph.nodes.score_nodes._score_activity", return_value=["kayak_msgs"])
def test_score_kayaking(mock_score, sample_state):
    result = score_kayaking(sample_state)
    mock_score.assert_called_once_with(sample_state, "kayaking")
    assert result == {"kayaking_forecast": ["kayak_msgs"]}


@patch("langraph.nodes.score_nodes._score_activity", return_value=["snorkel_msgs"])
def test_score_snorkelling(mock_score, sample_state):
    result = score_snorkelling(sample_state)
    mock_score.assert_called_once_with(sample_state, "snorkelling")
    assert result == {"snorkelling_forecast": ["snorkel_msgs"]}


@patch("langraph.nodes.score_nodes._score_activity", return_value=["cycle_msgs"])
def test_score_cycling(mock_score, sample_state):
    result = score_cycling(sample_state)
    mock_score.assert_called_once_with(sample_state, "cycling")
    assert result == {"cycling_forecast": ["cycle_msgs"]}
