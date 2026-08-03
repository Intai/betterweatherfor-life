import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    score_llm = ClaudeCLIModelWithTools(model="opus")
elif provider == "xai":
    from langchain_xai import ChatXAI

    score_llm = ChatXAI(model="grok-4.20-reasoning", temperature=0)
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    score_llm = ChatGoogleGenerativeAI(
        model="gemini-3.1-pro-preview",
        temperature=0,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    score_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
    )
