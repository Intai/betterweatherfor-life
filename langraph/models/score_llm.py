import os

provider = os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

# Routes every scoring request to the same xAI server so they can share a prefix
# cache. Stable by design — see the ChatXAI branch below.
CACHE_ROUTING_ID = "betterweather-score"

if provider == "claude-cli":
    from langraph.models.claude_cli import ClaudeCLIModelWithTools

    score_llm = ClaudeCLIModelWithTools(model="opus")
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
    score_llm = ChatXAI(
        model="grok-4.20-reasoning",
        temperature=0,
        max_tokens=48000,
        default_headers={"x-grok-conv-id": CACHE_ROUTING_ID},
    )
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
