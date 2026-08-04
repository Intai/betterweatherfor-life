from unittest.mock import MagicMock, patch

import pytest

from langraph.agents.fetch_agent import RECURSION_LIMIT, run_fetch_agent

COLUMNAR = '{"fields": ["time", "seaTempC"], "rows": [["2026-08-04T06:00", 12.8]]}'
COMPACTED = '{"fields":["time","seaTempC"],"rows":[["2026-08-04T06:00",12.8]]}'


def _mock_agent(content):
    mock_msg = MagicMock()
    mock_msg.content = content
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [mock_msg]}
    return mock_agent


@patch("langraph.agents.fetch_agent.create_react_agent")
def test_run_fetch_agent(mock_create):
    mock_agent = _mock_agent(COLUMNAR)
    mock_create.return_value = mock_agent

    result = run_fetch_agent("fetch weather data")

    mock_agent.invoke.assert_called_once_with(
        {"messages": [{"role": "user", "content": "fetch weather data"}]},
        {"recursion_limit": RECURSION_LIMIT},
    )
    assert result == COMPACTED


@patch("langraph.agents.fetch_agent.create_react_agent")
def test_run_fetch_agent_with_content_blocks(mock_create):
    mock_create.return_value = _mock_agent([{"text": COLUMNAR}])
    assert run_fetch_agent("prompt") == COMPACTED


@patch("langraph.agents.fetch_agent.create_react_agent")
def test_run_fetch_agent_rejects_truncated_response(mock_create):
    mock_create.return_value = _mock_agent('{"fields": ["time"], "rows": [["06:0')
    with pytest.raises(ValueError, match="not valid JSON"):
        run_fetch_agent("prompt")
