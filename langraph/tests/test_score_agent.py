from unittest.mock import patch, MagicMock

from langraph.agents.score_agent import run_score_agent


@patch("langraph.agents.score_agent.create_react_agent")
def test_run_score_agent(mock_create):
    msg1 = MagicMock()
    msg2 = MagicMock()
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [msg1, msg2]}
    mock_create.return_value = mock_agent

    result = run_score_agent("score sup activity")

    mock_agent.invoke.assert_called_once_with(
        {"messages": [{"role": "user", "content": "score sup activity"}]}
    )
    assert result == [msg1, msg2]
