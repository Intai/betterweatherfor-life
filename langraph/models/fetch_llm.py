import os

# Routes every fetch request to the same xAI server so they can share a prefix
# cache. Stable by design — see the ChatXAI branch below.
CACHE_ROUTING_ID = "betterweather-fetch"


def build_fetch_llm(provider=None, model=None, effort=None):
    """Build a fetch chat model for one provider, model and reasoning effort.

    Each argument falls back to its environment variable, so the module-level
    `fetch_llm` below is built exactly as it was when this file was a bare
    if/elif at import time. Passing them instead is what lets one process hold
    several models at once and compare them, which `langraph/evals` relies on —
    re-reading the environment mid-sweep would quietly measure the wrong model.
    A model given here reaches the agent through `build_fetch_graph`, which binds
    it to the node, and `run_fetch_agent`, which hands it to `create_react_agent`.

    Args:
        provider: `claude-cli`, `xai`, `gemini`, `openai`, or anything else for
            OpenRouter. Defaults to `LANGGRAPH_LLM_PROVIDER`.
        model: The provider's own model name, or None for that provider's default.
            Defaults to `LANGGRAPH_FETCH_MODEL`.
        effort: A reasoning effort the provider understands, or None to leave it
            on whatever that provider already did. Defaults to
            `LANGGRAPH_FETCH_EFFORT`.

    Returns:
        A new chat model on every call.
    """
    provider = provider or os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter")

    # Every branch reads the same two overrides so a run can be re-measured without a
    # code change. The defaults differ because each provider names its own models, and
    # an unset effort leaves that provider on whatever it already did.
    model = model or os.environ.get("LANGGRAPH_FETCH_MODEL")
    effort = effort or os.environ.get("LANGGRAPH_FETCH_EFFORT")

    if provider == "claude-cli":
        from langraph.models.claude_cli import ClaudeCLIModelWithTools

        # Sonnet is the floor on model: haiku downsampled the marine hours to every
        # second hour at low effort and returned unparseable JSON at medium.
        return ClaudeCLIModelWithTools(
            model=model or "sonnet",
            effort=effort or "medium",
        )

    if provider == "xai":
        from langchain_xai import ChatXAI

        # Each fetch is a ReAct loop that replays its own history every turn, which is
        # exactly what a prefix cache is for — but xAI caches per server and load
        # balances, so a turn only hits if it lands back on the same box. Pinning the
        # routing is what makes the replay reliably cheap rather than luck: one water
        # quality turn re-sent 17,754 tokens and got 3,136 of them back from cache.
        #
        # xAI wants `reasoning_effort` inside `extra_body` rather than as a field. It is
        # always sent now that it is always set — a `LANGGRAPH_FETCH_MODEL` naming one of
        # the grok models that reject the knob outright will 400 with no way to unset it.
        return ChatXAI(
            model=model or "grok-4.5",
            temperature=0,
            max_tokens=24000,
            default_headers={"x-grok-conv-id": CACHE_ROUTING_ID},
            extra_body={"reasoning_effort": effort or "low"},
        )

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        # Gemini 3 deprecated `thinking_budget` in favour of `reasoning_effort`, which
        # takes the same low/medium/high vocabulary.
        return ChatGoogleGenerativeAI(
            model=model or "gemini-3.5-flash",
            max_output_tokens=24000,
            reasoning_effort=effort or "low",
            google_api_key=os.environ.get("GOOGLE_GEMINI_API_KEY"),
        )

    if provider == "openai":
        from langchain_openai import ChatOpenAI

        # No `temperature`, unlike every other branch here: the GPT-5 family rejects
        # any value but its own default with a 400.
        #
        # The family answers a 400 to `reasoning_effort` alongside function tools on
        # /v1/chat/completions, and every fetch binds the curl tool, so an effort has to
        # go to /v1/responses instead. `none` is the way back to chat completions, and
        # what terra wants.
        reasoning = effort or "low"
        return ChatOpenAI(
            api_key=os.environ.get("OPENAI_API_KEY"),
            model=model or "gpt-5.6-luna",
            max_tokens=24000,
            reasoning_effort=reasoning,
            use_responses_api=reasoning != "none",
        )

    from langchain_openai import ChatOpenAI

    # Reasoning used to be disabled outright here, with `reasoning: {enabled: False}`:
    # reshaping an API response into columnar rows is mechanical, thinking about it only
    # crowds out the rows, and one fetch spent 19k reasoning tokens narrating and then
    # hit its output cap mid-answer.
    return ChatOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=os.environ.get("OPENROUTER_API_KEY"),
        model=model or "moonshotai/kimi-k3",
        temperature=0,
        max_tokens=24000,
        reasoning_effort=effort or "low",
    )


fetch_llm = build_fetch_llm()
