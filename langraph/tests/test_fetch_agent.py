from unittest.mock import patch, MagicMock

from langraph.agents.fetch_agent import run_fetch_agent


@patch("langraph.agents.fetch_agent.create_react_agent")
def test_run_fetch_agent(mock_create):
    mock_msg = MagicMock()
    mock_msg.content = "fetched data"
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [mock_msg]}
    mock_create.return_value = mock_agent

    result = run_fetch_agent("fetch weather data")

    mock_agent.invoke.assert_called_once_with(
        {"messages": [{"role": "user", "content": "fetch weather data"}]}
    )
    assert result == "fetched data"


@patch("langraph.agents.fetch_agent.create_react_agent")
def test_run_fetch_agent_with_content_blocks(mock_create):
    mock_msg = MagicMock()
    mock_msg.content = [{"text": "block1"}, {"text": "block2"}]
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [mock_msg]}
    mock_create.return_value = mock_agent

    result = run_fetch_agent("prompt")
    assert result == "block1\nblock2"
