from unittest.mock import MagicMock, patch

import pytest
from langchain_core.messages import HumanMessage

from langraph.agents.score_agent import run_score


def reply(content, key="finish_reason", reason="stop", output_tokens=1200):
    """A model reply carrying the stop signal the provider sent back.

    The key varies with the provider: the OpenAI-compatible ones and Gemini write
    `finish_reason`, the Claude CLI writes `stop_reason`.
    """
    return MagicMock(
        content=content,
        response_metadata={key: reason},
        usage_metadata={"output_tokens": output_tokens},
    )


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_sends_one_human_message(mock_llm):
    mock_llm.invoke.return_value = reply('{"sup;2026-08-05": {}}')

    result = run_score("score sup activity")

    (messages,), _ = mock_llm.invoke.call_args
    assert len(messages) == 1
    assert isinstance(messages[0], HumanMessage)
    assert messages[0].content == "score sup activity"
    assert result == '{"sup;2026-08-05": {}}'


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_flattens_content_blocks(mock_llm):
    mock_llm.invoke.return_value = reply([{"text": '{"a": 1}'}])

    assert run_score("score sup activity") == '{"a": 1}'


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_calls_the_model_once(mock_llm):
    # Scoring used to loop as a ReAct agent, re-writing the same file and billing
    # the whole forecast JSON again on every retry.
    mock_llm.invoke.return_value = reply("{}")

    run_score("score sup activity")

    mock_llm.invoke.assert_called_once()


# The three spellings the providers actually send back for a capped answer.
@pytest.mark.parametrize(("key", "reason"), [
    ("finish_reason", "length"),      # OpenRouter and xAI, the OpenAI vocabulary
    ("finish_reason", "MAX_TOKENS"),  # Gemini, its own enum name
    ("stop_reason", "max_tokens"),    # the Claude CLI, Anthropic's vocabulary
])
@patch("langraph.agents.score_agent.score_llm")
def test_run_score_reports_an_answer_cut_off_at_the_token_cap(mock_llm, key, reason):
    # Truncated and self-ended answers both break mid-object, so the stop signal
    # is the only thing that tells them apart.
    mock_llm.invoke.return_value = reply('{"hourly":{', key=key, reason=reason,
                                         output_tokens=48000)

    with pytest.raises(
        ValueError, match=f"cut short at the token cap \\({reason}\\) after 48000"
    ):
        run_score("score sup activity")


@pytest.mark.parametrize(("key", "reason"), [
    ("finish_reason", "stop"),
    ("stop_reason", "end_turn"),
])
@patch("langraph.agents.score_agent.score_llm")
def test_run_score_returns_an_answer_the_model_ended_itself(mock_llm, key, reason):
    # An answer the model ended itself that still breaks mid-object means it gave
    # up on its own, and the JSON error downstream says where.
    mock_llm.invoke.return_value = reply('{"hourly":{', key=key, reason=reason)

    assert run_score("score sup activity") == '{"hourly":{'


@patch("langraph.agents.score_agent.score_llm")
def test_run_score_tolerates_a_missing_finish_reason(mock_llm):
    mock_llm.invoke.return_value = MagicMock(content="{}", response_metadata=None,
                                             usage_metadata=None)

    assert run_score("score sup activity") == "{}"
