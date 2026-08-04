from unittest.mock import MagicMock, patch

from langraph.agents.score_agent import RECURSION_LIMIT, run_score_agent


@patch("langraph.agents.score_agent.create_react_agent")
def test_run_score_agent(mock_create):
    msg1 = MagicMock()
    msg2 = MagicMock()
    mock_agent = MagicMock()
    mock_agent.invoke.return_value = {"messages": [msg1, msg2]}
    mock_create.return_value = mock_agent

    result = run_score_agent("score sup activity")

    mock_agent.invoke.assert_called_once_with(
        {"messages": [{"role": "user", "content": "score sup activity"}]},
        {"recursion_limit": RECURSION_LIMIT},
    )
    assert result == [msg1, msg2]


def test_recursion_limit_bounds_a_stuck_agent():
    # A trace once ran 23 turns at ~80k input tokens each before finishing.
    assert RECURSION_LIMIT < 23
