import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

# Routes every scoring request to the same xAI server so they can share a prefix
# cache. Stable by design — see the ChatXAI branch below.
CACHE_ROUTING_ID = "betterweather-score"

# Every branch reads the same two overrides so a run can be re-measured without a code
# change. The defaults differ because each provider names its own models, and an unset
# effort leaves that provider on whatever it already did.
model = os.environ.get("LANGGRAPH_SCORE_MODEL")
effort = os.environ.get("LANGGRAPH_SCORE_EFFORT")

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    # Scoring runs at a steady ~90 output tokens/sec, so wall time is simply a count
    # of tokens generated, and the answer itself is ~17-20k of them. Thinking was the
    # rest, and it shrank with each step down: 52-56% of output at the SDK's default
    # `high`, 44-52% at medium, 32-36% at low. Measured end to end on one location,
    # low cut the whole graph from 16m39s to 11m03s.
    #
    # Sonnet is not a cheaper substitute here: at the same low effort it spent more
    # tokens than opus (56-71% of them on thinking, against opus's 32-36%), ran
    # slower, and truncated the final day out of two activities.
    score_llm = ClaudeCLIModelWithTools(
        model=model or "opus",
        effort=effort or "low",
    )
elif provider == "xai":
    from langchain_xai import ChatXAI

    # A full 10 days of hourly weather pushed a legitimate answer to 32,080 tokens,
    # which truncated it mid-JSON at the old 32k cap. The API accepts up to 131k;
    # this leaves ~50% headroom while still failing a runaway loop well short of it.
    #
    # xAI's prefix cache is per-server and requests are load balanced, so a hit only
    # lands if the request reaches the box holding the prefix. `x-grok-conv-id` pins
    # the routing. Without it the four scorers read 128 cached tokens out of ~16k
    # each, even once `score.txt` led with the criteria block they all share and the
    # graph ran one scorer to completion first. A constant, rather than a per-run id,
    # so that block stays warm across activities, locations and days.
    #
    # xAI wants `reasoning_effort` inside `extra_body` rather than as a field, and
    # several grok models reject it outright, so it is only sent when asked for.
    score_llm = ChatXAI(
        model=model or "grok-4.20-reasoning",
        temperature=0,
        max_tokens=48000,
        default_headers={"x-grok-conv-id": CACHE_ROUTING_ID},
        **({"extra_body": {"reasoning_effort": effort}} if effort else {}),
    )
elif provider == "gemini":
    from langchain_google_genai import ChatGoogleGenerativeAI

    # Gemini 3 deprecated `thinking_budget` in favour of `reasoning_effort`, which
    # takes the same low/medium/high vocabulary.
    score_llm = ChatGoogleGenerativeAI(
        model=model or "gemini-3.6-flash",
        temperature=0,
        max_output_tokens=32000,
        reasoning_effort=effort,
        google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
    )
else:
    from langchain_openai import ChatOpenAI

    # Headroom for 40 entries with prose summaries, but below the model's own 65k
    # ceiling so a runaway reasoning loop fails fast instead of truncating mid-JSON.
    score_llm = ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model=model or "nvidia/nemotron-3-super-120b-a12b:free",
        temperature=0,
        max_tokens=32000,
        reasoning_effort=effort,
    )
