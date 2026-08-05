from unittest.mock import MagicMock, patch

from langchain_core.messages import HumanMessage

from langraph.agents.score_agent import run_score


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_sends_one_human_message(mock_llm):
    mock_llm.invoke.return_value = MagicMock(content='{"sup;2026-08-05": {}}')

    result = run_score("score sup activity")

    (messages,), _ = mock_llm.invoke.call_args
    assert len(messages) == 1
    assert isinstance(messages[0], HumanMessage)
    assert messages[0].content == "score sup activity"
    assert result == '{"sup;2026-08-05": {}}'


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_flattens_content_blocks(mock_llm):
    mock_llm.invoke.return_value = MagicMock(content=[{"text": '{"a": 1}'}])

    assert run_score("score sup activity") == '{"a": 1}'


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_calls_the_model_once(mock_llm):
    # Scoring used to loop as a ReAct agent, re-writing the same file and billing
    # the whole forecast JSON again on every retry.
    mock_llm.invoke.return_value = MagicMock(content="{}")

    run_score("score sup activity")

    mock_llm.invoke.assert_called_once()
