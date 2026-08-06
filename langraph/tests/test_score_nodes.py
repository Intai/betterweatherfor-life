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
from langraph.utils.score_parser import (
    FORECAST_WINDOWS,
    forecast_dates,
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


def answer(days=10, offset=0):
    """Serialise a scored table covering a slice of the forecast range."""
    dates = forecast_dates("2026-03-24")[offset:offset + days]
    return json.dumps({
        "entries": {
            f"{date};{window}": {"score": 80, "summary": "Fine.", "analysis": "Fine."}
            for date in dates
            for window in FORECAST_WINDOWS
        },
        "hourly": {date: {"from": "06:00", "scores": [80] * 17} for date in dates},
    })


@patch("langraph.nodes.score_nodes.run_score", return_value=answer())
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity(mock_load, mock_score, sample_state, tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)

    result = _score_activity(sample_state, "sup")

    call_kwargs = mock_load.call_args[1]
    assert call_kwargs["activity"] == "sup"
    assert call_kwargs["latitude"] == "-36.8485"
    assert call_kwargs["longitude"] == "174.7633"
    assert call_kwargs["date"] == "2026-03-24"
    assert call_kwargs["entry_count"] == 40
    assert call_kwargs["dates"].startswith("2026-03-24, 2026-03-25")
    # The prompt no longer names a file; the node owns the write.
    assert "file_path" not in call_kwargs

    mock_score.assert_called_once_with("score prompt")
    assert len(result) == 40


@patch("langraph.nodes.score_nodes.run_score", return_value=answer())
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_writes_the_forecast_file(mock_load, mock_score, sample_state,
                                                 tmp_path, monkeypatch):
    # Relative to the working directory, which db/update-forecasts.js reads back.
    monkeypatch.chdir(tmp_path)

    _score_activity(sample_state, "sup")

    written = json.loads((tmp_path / "mission-bay-sup.json").read_text())
    assert len(written) == 40
    assert max(key.split(";")[1] for key in written) == "2026-04-02"


@patch("langraph.nodes.score_nodes.run_score", return_value="not json")
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_writes_nothing_when_the_answer_is_unusable(mock_load, mock_score,
                                                                   sample_state, tmp_path,
                                                                   monkeypatch):
    # A short answer is kept as-is, but one that cannot be parsed at all is loud.
    monkeypatch.chdir(tmp_path)

    with pytest.raises(ValueError, match="not valid JSON"):
        _score_activity(sample_state, "sup")

    assert not (tmp_path / "mission-bay-sup.json").exists()


def answer_with_a_bad_entry():
    """A full answer carrying one entry the parser has to skip."""
    payload = json.loads(answer())
    payload["entries"]["2026-03-24;morning"] = "not an object"
    return json.dumps(payload)


@patch("langraph.nodes.score_nodes.run_score", return_value=answer_with_a_bad_entry())
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_keeps_the_entries_that_parsed(mock_load, mock_score, sample_state,
                                                      tmp_path, monkeypatch):
    # `db/update-forecasts.js` upserts the keys it finds and deletes nothing, so
    # the one window that failed keeps its previous row rather than blocking the
    # other thirty-nine.
    monkeypatch.chdir(tmp_path)

    result = _score_activity(sample_state, "sup")

    assert len(result) == 39
    assert "sup;2026-03-24;morning;-36.8485,174.7633" not in result
    assert len(json.loads((tmp_path / "mission-bay-sup.json").read_text())) == 39


def answer_without_scores():
    """An answer whose entries all came back empty, so nothing would upsert."""
    payload = json.loads(answer(days=1))
    payload["entries"] = {key: {} for key in payload["entries"]}
    return json.dumps(payload)


@patch("langraph.nodes.score_nodes.run_score", return_value=answer_without_scores())
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_refuses_an_answer_with_no_scores(mock_load, mock_score,
                                                         sample_state, tmp_path,
                                                         monkeypatch):
    # `db/update-forecasts.js` would upsert nothing and the activity would quietly
    # serve yesterday's forecast, so this has to be loud.
    monkeypatch.chdir(tmp_path)

    with pytest.raises(ValueError, match="no scored entries out of 40"):
        _score_activity(sample_state, "sup")

    assert not (tmp_path / "mission-bay-sup.json").exists()


@patch("langraph.nodes.score_nodes.run_score", return_value=answer(days=1))
@patch("langraph.nodes.score_nodes.load_prompt", return_value="score prompt")
def test_score_activity_keeps_a_short_answer(mock_load, mock_score, sample_state,
                                             tmp_path, monkeypatch):
    # A scorer that stops after the first day is no longer re-asked; the rest of
    # the range simply keeps whatever it had.
    monkeypatch.chdir(tmp_path)

    result = _score_activity(sample_state, "sup")

    assert len(result) == 4
    assert mock_score.call_count == 1


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
