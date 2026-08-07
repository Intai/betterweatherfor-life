from langchain_core.messages import HumanMessage

from langraph.models.score_llm import score_llm
from langraph.utils.messages import extract_message_text

# A completion the provider stopped at the token cap and one the model chose to
# end look identical downstream: both break mid-object, and `json.loads` reports
# the same "Expecting ',' delimiter" either way. Checking the finish reason is
# what tells the two apart — one snorkelling answer stopped at 18,966 output
# tokens against a 48,000 cap, which the JSON error alone could not explain.
#
# Each provider `score_llm` can be pointed at spells that reason differently, and
# `length` alone is the OpenAI vocabulary that only two of them speak: OpenRouter
# and xAI say `finish_reason: length`, Gemini writes its own enum name into the
# same key as `MAX_TOKENS`, and the Claude CLI reports Anthropic's `stop_reason:
# max_tokens` instead. Lower-casing collapses the last two onto one word.
TRUNCATED = frozenset({"length", "max_tokens"})
REASON_KEYS = ("finish_reason", "stop_reason")


def truncated_at(response):
    """Name the reason the provider gave for stopping at its cap, if it did."""
    metadata = response.response_metadata or {}
    for key in REASON_KEYS:
        reason = metadata.get(key)
        if reason and str(reason).lower() in TRUNCATED:
            return str(reason)
    return None


def invoke_score(prompt, llm=None):
    """Ask the LLM to score an activity and return its whole reply.

    The message rather than its text, because a caller judging the answer wants
    the token counts and the stop reason that came back with it. `run_score`
    below is the same call for a caller that only wants the JSON.

    Args:
        prompt: The scoring instructions with fetched data and criteria.
        llm: A chat model to use instead of the module singleton, so one process
            can score against several models.

    Returns:
        The provider's reply message.
    """
    return (llm or score_llm).invoke([HumanMessage(content=prompt)])


def truncation_error(response):
    """Word the failure for an answer the provider cut off at its token cap."""
    usage = response.usage_metadata or {}
    return ValueError(
        f"Score response was cut short at the token cap ({truncated_at(response)}) "
        f"after {usage.get('output_tokens')} output tokens"
    )


def run_score(prompt):
    """Ask the LLM to score an activity and return its raw JSON answer.

    Deliberately a single stateless call rather than a ReAct agent. Scoring was
    once an agent holding a `write_file` tool, but with one tool and one thing to
    write there is nothing to iterate on: the loop only ever re-wrote the same
    file, and because each turn replays the previous turn's tool call arguments,
    every retry billed the whole forecast JSON again as input. One trace spent
    213k tokens on four rewrites and still hit the recursion limit.

    Args:
        prompt: The scoring instructions with fetched data and criteria.

    Returns:
        The response text, expected to be the forecast JSON.

    Raises:
        ValueError: If the provider cut the answer off at the token cap, under
            whichever finish or stop reason it reports that with, which is worth
            saying plainly rather than leaving to a JSON error halfway through
            the text.
    """
    response = invoke_score(prompt)

    if truncated_at(response):
        raise truncation_error(response)

    return extract_message_text(response.content)
