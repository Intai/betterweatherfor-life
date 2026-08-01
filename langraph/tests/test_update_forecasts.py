import sys
from unittest.mock import MagicMock, patch

import pytest

from langraph.app.update_forecasts import main


@patch("langraph.app.update_forecasts.load_dotenv")
def test_main_full_pipeline(mock_dotenv, capsys):
    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {}
    test_args = [
        "prog", "--lat", "-36.8", "--lng", "174.7",
        "--date", "2026-03-24", "--timezone", "Pacific/Auckland",
        "--slug", "mission-bay",
    ]
    with (
        patch.object(sys, "argv", test_args),
        patch("langraph.app.graph.build_graph", return_value=mock_graph) as mock_build,
    ):
        main()
        mock_build.assert_called_once()
        mock_graph.invoke.assert_called_once_with({
            "latitude": "-36.8",
            "longitude": "174.7",
            "date": "2026-03-24",
            "timezone": "Pacific/Auckland",
            "location_slug": "mission-bay",
        })
    captured = capsys.readouterr()
    assert "Forecast complete for mission-bay" in captured.out


@patch("langraph.app.update_forecasts.load_dotenv")
def test_main_single_fetch(mock_dotenv, capsys):
    mock_graph = MagicMock()
    mock_graph.invoke.return_value = {"water_quality": "wq_result"}
    test_args = [
        "prog", "--lat", "-36.8", "--lng", "174.7",
        "--date", "2026-03-24", "--timezone", "Pacific/Auckland",
        "--slug", "mission-bay", "--fetch", "water_quality",
    ]
    with (
        patch.object(sys, "argv", test_args),
        patch(
            "langraph.app.graph.build_fetch_graph", return_value=mock_graph
        ) as mock_build,
    ):
        main()
        mock_build.assert_called_once_with("water_quality")
        mock_graph.invoke.assert_called_once()
    captured = capsys.readouterr()
    assert "wq_result" in captured.out


def test_main_missing_required_args():
    with patch.object(sys, "argv", ["prog"]), pytest.raises(SystemExit):
        main()
