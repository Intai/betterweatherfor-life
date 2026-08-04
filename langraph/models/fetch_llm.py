import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    fetch_llm = ClaudeCLIModelWithTools(model="sonnet")
elif provider == "xai":
    from langchain_xai import ChatXAI

    fetch_llm = ChatXAI(model="grok-4.3-latest", temperature=0, max_tokens=24000)
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    fetch_llm = ChatGoogleGenerativeAI(
        model="gemini-3-flash-preview",
        temperature=0,
        max_output_tokens=24000,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    # Reshaping an API response into columnar rows is mechanical, and reasoning about
    # it only crowds out the rows: one fetch spent 19k reasoning tokens narrating and
    # then hit its output cap mid-answer. This model ignores both `reasoning_effort`
    # and `reasoning.max_tokens`, so disabling reasoning outright is the only knob
    # that takes effect on OpenRouter.
    fetch_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model="nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
        max_tokens=24000,
        extra_body={"reasoning": {"enabled": False}},
    )
