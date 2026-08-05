import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    score_llm = ClaudeCLIModelWithTools(model="opus")
elif provider == "xai":
    from langchain_xai import ChatXAI

    score_llm = ChatXAI(model="grok-4.20-reasoning", temperature=0, max_tokens=32000)
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    score_llm = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash",
        temperature=0,
        max_output_tokens=32000,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    # Headroom for 40 entries with prose summaries, but below the model's own 65k
    # ceiling so a runaway reasoning loop fails fast instead of truncating mid-JSON.
    score_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
        max_tokens=32000,
    )
