import json
from unittest.mock import patch

import pytest

from langraph.nodes.score_nodes import (
    SECTIONS,
    _build_fetched_data,
    _score_activity,
    score_cycling,
    score_kayaking,
    score_snorkelling,
    score_sup,
)


def test_build_fetched_data_full(sample_state):
    result = _build_fetched_data(sample_state, "sup")
    assert "### Water Quality" in result
    assert "### Tides" in result
    assert "### Weather" in result
    assert "### Sea Surface Temperature and Swell" in result
    assert "### Sunrise/Sunset" in result
    assert '```json' in result


def test_build_fetched_data_empty(minimal_state):
    result = _build_fetched_data(minimal_state, "sup")
    assert result == ""


def test_build_fetched_data_partial(minimal_state):
    minimal_state["tides"] = '{"nextHigh": "10:30"}'
    minimal_state["weather"] = '{"temp": 22}'
    result = _build_fetched_data(minimal_state, "sup")
    expected = (
        '### Tides\n```json\n{"nextHigh": "10:30"}\n```'
        "\n\n"
        '### Weather\n```json\n{"temp": 22}\n```'
    )
    assert result == expected


def test_build_fetched_data_cycling_omits_water_sources(sample_state):
    result = _build_fetched_data(sample_state, "cycling")
    assert "### Weather" in result
    assert "### Sunrise/Sunset" in result
    assert "### Water Quality" not in result
    assert "### Tides" not in result
    assert "### Sea Surface Temperature and Swell" not in result


@pytest.mark.parametrize("activity", ["sup", "kayaking", "snorkelling"])
def test_build_fetched_data_water_activities_get_every_source(sample_state, activity):
    result = _build_fetched_data(sample_state, activity)
    assert result.count("```json") == len(SECTIONS)


def test_build_fetched_data_unknown_activity(sample_state):
    with pytest.raises(KeyError):
        _build_fetched_data(sample_state, "skateboarding")


@patch("langraph.nodes.score_nodes.parse_forecast", return_value={"sup;2026-03-24": {}})
@patch("langraph.nodes.score_nodes.run_score", return_value='{"sup;2026-03-24": {}}')
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity(mock_load, mock_score, mock_parse, sample_state, tmp_path,
                        monkeypatch):
    monkeypatch.chdir(tmp_path)

    result = _score_activity(sample_state, "sup")

    mock_load.assert_called_once()
    call_kwargs = mock_load.call_args[1]
    assert call_kwargs["activity"] == "sup"
    assert call_kwargs["latitude"] == "-36.8485"
    assert call_kwargs["longitude"] == "174.7633"
    assert call_kwargs["date"] == "2026-03-24"
    # The prompt no longer names a file; the node owns the write.
    assert "file_path" not in call_kwargs

    mock_score.assert_called_once_with("score prompt")
    mock_parse.assert_called_once_with(
        '{"sup;2026-03-24": {}}', "sup", "2026-03-24", "-36.8485", "174.7633"
    )
    assert result == {"sup;2026-03-24": {}}


@patch("langraph.nodes.score_nodes.parse_forecast", return_value={"sup;2026-03-24": {}})
@patch("langraph.nodes.score_nodes.run_score", return_value="{}")
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_writes_the_forecast_file(mock_load, mock_score, mock_parse,
                                                 sample_state, tmp_path, monkeypatch):
    # Relative to the working directory, which db/update-forecasts.js reads back.
    monkeypatch.chdir(tmp_path)

    _score_activity(sample_state, "sup")

    written = tmp_path / "mission-bay-sup.json"
    assert json.loads(written.read_text()) == {"sup;2026-03-24": {}}


@patch("langraph.nodes.score_nodes.run_score", return_value="not json")
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_writes_nothing_when_validation_fails(mock_load, mock_score,
                                                             sample_state, tmp_path,
                                                             monkeypatch):
    monkeypatch.chdir(tmp_path)

    with pytest.raises(ValueError, match="not valid JSON"):
        _score_activity(sample_state, "sup")

    assert not (tmp_path / "mission-bay-sup.json").exists()


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
