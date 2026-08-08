import os

# Routes every scoring request to the same xAI server so they can share a prefix
# cache. Stable by design — see the ChatXAI branch below.
CACHE_ROUTING_ID = "betterweather-score"


def build_score_llm(provider=None, model=None, effort=None):
    """Build a scoring chat model for one provider, model and reasoning effort.

    Each argument falls back to its environment variable, so the module-level
    `score_llm` below is built exactly as it was when this file was a bare
    if/elif at import time. Passing them instead is what lets one process hold
    several models at once and compare them, which `langraph/evals` relies on —
    re-reading the environment mid-sweep would quietly measure the wrong model.

    Args:
        provider: `claude-cli`, `xai`, `gemini`, `openai`, or anything else for
            OpenRouter. Defaults to `LANGGRAPH_LLM_PROVIDER`.
        model: The provider's own model name, or None for that provider's default.
            Defaults to `LANGGRAPH_SCORE_MODEL`.
        effort: A reasoning effort the provider understands, or None to leave it
            on whatever that provider already did. Defaults to
            `LANGGRAPH_SCORE_EFFORT`.

    Returns:
        A new chat model on every call.
    """
    provider = provider or os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

    # Every branch reads the same two overrides so a run can be re-measured without a
    # code change. The defaults differ because each provider names its own models, and
    # an unset effort leaves that provider on whatever it already did.
    model = model or os.environ.get("LANGGRAPH_SCORE_MODEL")
    effort = effort or os.environ.get("LANGGRAPH_SCORE_EFFORT")

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
        return ClaudeCLIModelWithTools(
            model=model or "opus",
            effort=effort or "low",
        )

    if provider == "xai":
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
        return ChatXAI(
            model=model or "grok-4.5",
            temperature=0,
            max_tokens=48000,
            default_headers={"x-grok-conv-id": CACHE_ROUTING_ID},
            **({"extra_body": {"reasoning_effort": effort}} if effort else {}),
        )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        # Gemini 3 deprecated `thinking_budget` in favour of `reasoning_effort`, which
        # takes the same low/medium/high vocabulary.
        return ChatGoogleGenerativeAI(
            model=model or "gemini-3.1-pro-preview",
            temperature=0,
            max_output_tokens=48000,
            reasoning_effort=effort,
            google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        # No `temperature`, unlike every other branch here: the GPT-5 family rejects
        # any value but its own default with a 400.
        return ChatOpenAI(
            api_key=os.environ.get("OPENAI_API_KEY"),
            model=model or "gpt-5.6-terra",
            max_tokens=48000,
            reasoning_effort=effort,
        )

    from langchain_openai import ChatOpenAI

    # Headroom for 40 entries with prose summaries, but below the model's own 65k
    # ceiling so a runaway reasoning loop fails fast instead of truncating mid-JSON.
    return ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model=model or "nvidia/nemotron-3-ultra-550b-a55b:free",
        temperature=0,
        max_tokens=48000,
        reasoning_effort=effort,
    )


score_llm = build_score_llm()
