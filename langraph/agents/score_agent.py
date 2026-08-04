from langgraph.prebuilt import create_react_agent

from langraph.models.score_llm import score_llm
from langraph.tools.write_file_tool import write_file

# Scoring is one write_file call. LangGraph counts supersteps rather than turns, so
# this allows ~4 tool calls before giving up instead of letting a stuck agent loop.
RECURSION_LIMIT = 10


def run_score_agent(prompt):
    """Run a ReAct agent that scores an activity and writes the JSON output.

    Args:
        prompt: The scoring instructions with fetched data and criteria.

    Returns:
        The agent's final response content.
    """
    agent = create_react_agent(score_llm, [write_file])
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]},
        {"recursion_limit": RECURSION_LIMIT},
    )
    return result["messages"]
