from langchain_core.messages import HumanMessage

from langraph.agents.utils import extract_message_text
from langraph.models.score_llm import score_llm


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
    """
    response = score_llm.invoke([HumanMessage(content=prompt)])
    return extract_message_text(response.content)
