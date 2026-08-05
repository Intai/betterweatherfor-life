from langgraph.prebuilt import create_react_agent

from langraph.agents.utils import compact_columnar, extract_message_text
from langraph.models.fetch_llm import fetch_llm
from langraph.tools.curl_tool import curl

# `fetch_weather` legitimately pages ~10 times through nextPageToken, and LangGraph
# counts supersteps rather than turns, so this sits just above the default of 25.
RECURSION_LIMIT = 30


def run_fetch_agent(prompt):
    """Run a ReAct agent that fetches data from an API using the curl tool.

    Args:
        prompt: The fetch instructions for this data source.

    Returns:
        The columnar data string from the agent's final response.
    """
    agent = create_react_agent(fetch_llm, [curl])
    result = agent.invoke(
        {"messages": [{"role": "user", "content": prompt}]},
        {"recursion_limit": RECURSION_LIMIT},
    )
    return compact_columnar(extract_message_text(result["messages"][-1].content))
