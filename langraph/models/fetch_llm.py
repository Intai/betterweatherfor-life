import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

# Routes every fetch request to the same xAI server so they can share a prefix
# cache. Stable by design — see the ChatXAI branch below.
CACHE_ROUTING_ID = "betterweather-fetch"

# Every branch reads the same two overrides so a run can be re-measured without a code
# change. The defaults differ because each provider names its own models, and an unset
# effort leaves that provider on whatever it already did.
model = os.environ.get("LANGGRAPH_FETCH_MODEL")
effort = os.environ.get("LANGGRAPH_FETCH_EFFORT")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    # Sonnet is the floor on model: haiku downsampled the marine hours to every
    # second hour at low effort and returned unparseable JSON at medium.
    fetch_llm = ClaudeCLIModelWithTools(
        model=model or "sonnet",
        effort=effort or "medium",
    )
elif provider == "xai":
    from langchain_xai import ChatXAI

    # Each fetch is a ReAct loop that replays its own history every turn, which is
    # exactly what a prefix cache is for — but xAI caches per server and load
    # balances, so a turn only hits if it lands back on the same box. Pinning the
    # routing is what makes the replay reliably cheap rather than luck: one water
    # quality turn re-sent 17,754 tokens and got 3,136 of them back from cache.
    #
    # xAI wants `reasoning_effort` inside `extra_body` rather than as a field, and
    # several grok models reject it outright, so it is only sent when asked for.
    fetch_llm = ChatXAI(
        model=model or "grok-4.3-latest",
        temperature=0,
        max_tokens=24000,
        default_headers={"x-grok-conv-id": CACHE_ROUTING_ID},
        **({"extra_body": {"reasoning_effort": effort}} if effort else {}),
    )
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    # Gemini 3 deprecated `thinking_budget` in favour of `reasoning_effort`, which
    # takes the same low/medium/high vocabulary.
    fetch_llm = ChatGoogleGenerativeAI(
        model=model or "gemini-3.5-flash-lite",
        max_output_tokens=24000,
        reasoning_effort=effort or "low",
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    # Reshaping an API response into columnar rows is mechanical, and reasoning about
    # it only crowds out the rows: one fetch spent 19k reasoning tokens narrating and
    # then hit its output cap mid-answer. This model ignores both `reasoning_effort`
    # and `reasoning.max_tokens`, so disabling reasoning outright is the only knob
    # that takes effect on OpenRouter. `reasoning_effort` is still forwarded for the
    # sake of whatever model an override names.
    fetch_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model=model or "nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
        max_tokens=24000,
        reasoning_effort=effort,
        extra_body={"reasoning": {"enabled": False}},
    )
