import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    fetch_llm = ClaudeCLIModelWithTools(model="sonnet")
elif provider == "xai":
    from langchain_xai import ChatXAI

    fetch_llm = ChatXAI(model="grok-4-1-fast-reasoning", temperature=0)
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    fetch_llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=0,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    fetch_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
    )
