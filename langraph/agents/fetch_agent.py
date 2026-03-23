from langgraph.prebuilt import create_react_agent

from langraph.models.fetch_llm import fetch_llm
from langraph.agents.utils import extract_fetch_text
from langraph.tools.curl_tool import curl


def run_fetch_agent(prompt):
    """Run a ReAct agent that fetches data from an API using the curl tool.

    Args:
        prompt: The fetch instructions for this data source.

    Returns:
        The structured data string from the agent's final response.
    """
    agent = create_react_agent(fetch_llm, [curl])
    result = agent.invoke({"messages": [{"role": "user", "content": prompt}]})
    return extract_fetch_text(result["messages"][-1].content)
