"""LangChain chat model backed by the Claude Code CLI instead of a provider API.

Authenticates off the local Claude subscription via `claude-agent-sdk`, so no API
key is needed. The CLI normally runs its own agent loop, but a `BaseChatModel`
must expose a single stateless turn and let the caller execute tools. To get
that, tool schemas are registered as an in-process MCP server whose handlers
never run, and a PreToolUse hook denies execution and ends the turn, leaving the
`ToolUseBlock` to be returned as `AIMessage.tool_calls`.
"""

import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Any

import anyio
from claude_agent_sdk import (
    AssistantMessage,
    ClaudeAgentOptions,
    CLINotFoundError,
    HookMatcher,
    ResultMessage,
    TextBlock,
    ToolUseBlock,
    create_sdk_mcp_server,
    query,
    tool,
)
from langchain_core.language_models.chat_models import BaseChatModel
from langchain_core.messages import (
    AIMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.utils.function_calling import convert_to_openai_tool

MCP_SERVER_NAME = "langchain"
TOOL_PREFIX = f"mcp__{MCP_SERVER_NAME}__"

# Tool call args are replayed into every later turn's prompt, so a bulky argument
# (the forecast JSON handed to write_file) gets billed again as input. Anything
# longer than this is summarised instead; the tool's own result is unaffected.
MAX_ARG_CHARS = 500

# Denies execution and ends the turn, so the tool call reaches the caller intact.
_DENY_AND_STOP = {
    "hookSpecificOutput": {
        "hookEventName": "PreToolUse",
        "permissionDecision": "deny",
        "permissionDecisionReason": "Tool execution belongs to the caller.",
    },
    "continue": False,
    "stopReason": "Tool call captured by ClaudeCLIModelWithTools.",
}


def _block_text(content):
    """Flatten LangChain message content (string or content blocks) to plain text."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("text"):
                parts.append(block["text"])
        return "\n".join(parts)
    return str(content)


def _omit_large_args(args):
    """Replace oversized string values in tool call args with a length marker."""
    return {
        key: f"<{len(value)} chars omitted>"
        if isinstance(value, str) and len(value) > MAX_ARG_CHARS
        else value
        for key, value in (args or {}).items()
    }


def _render_messages(messages):
    """Split LangChain messages into a system prompt and a single user prompt.

    The CLI takes one prompt per call, so a multi-turn history is flattened into
    a transcript. A lone human message is passed through verbatim.

    Args:
        messages: The LangChain message list for this turn.

    Returns:
        A (system_prompt, prompt) tuple; system_prompt is None when unset.
    """
    system_parts = []
    conversation = []

    for message in messages:
        text = _block_text(message.content)
        if isinstance(message, SystemMessage):
            system_parts.append(text)
        else:
            conversation.append((message, text))

    system_prompt = "\n\n".join(part for part in system_parts if part) or None

    if len(conversation) == 1 and isinstance(conversation[0][0], HumanMessage):
        return system_prompt, conversation[0][1]

    lines = []
    for message, text in conversation:
        if isinstance(message, HumanMessage):
            lines.append(f"## User\n{text}")
        elif isinstance(message, AIMessage):
            calls = [
                f"Called tool `{call['name']}` with input "
                f"{_omit_large_args(call['args'])!r}"
                for call in (message.tool_calls or [])
            ]
            body = "\n".join(filter(None, [text, *calls]))
            lines.append(f"## Assistant\n{body}")
        elif isinstance(message, ToolMessage):
            lines.append(f"## Result of tool `{message.name}`\n{text}")
        else:
            lines.append(text)
    return system_prompt, "\n\n".join(lines)


def _make_stub(name, description, schema):
    """Build an SDK MCP tool that carries a schema but must never execute."""

    @tool(name, description, schema)
    async def _stub(args):
        return {
            "content": [
                {"type": "text", "text": f"{name} must be executed by the caller."}
            ],
            "is_error": True,
        }

    return _stub


def _tool_specs(tools):
    """Normalise bound LangChain tools into (name, description, schema) triples."""
    specs = []
    for item in tools or []:
        function = convert_to_openai_tool(item)["function"]
        specs.append(
            (
                function["name"],
                function.get("description") or function["name"],
                function.get("parameters") or {"type": "object", "properties": {}},
            )
        )
    return specs


def _usage_metadata(usage):
    """Map the SDK's usage dict onto LangChain's usage_metadata shape."""
    if not usage:
        return None
    # Anthropic reports only the uncached remainder in `input_tokens` and puts the rest
    # in the cache counters, so a fully cached 16k prompt reads as 2. LangChain wants
    # `input_tokens` to be the sum of every input type, with the split in the details.
    cache_read = usage.get("cache_read_input_tokens") or 0
    # The flat count, not the nested `cache_creation` breakdown by cache lifetime.
    cache_creation = usage.get("cache_creation_input_tokens") or 0
    input_tokens = (usage.get("input_tokens") or 0) + cache_read + cache_creation
    output_tokens = usage.get("output_tokens") or 0
    return {
        "input_tokens": input_tokens,
        "output_tokens": output_tokens,
        "total_tokens": input_tokens + output_tokens,
        "input_token_details": {
            "cache_read": cache_read,
            "cache_creation": cache_creation,
        },
    }


class ClaudeCLIModelWithTools(BaseChatModel):
    """Chat model that runs the Claude Code CLI via claude-agent-sdk.

    Tool calls are returned to the caller rather than executed, so this drops
    into `create_react_agent` in place of an API-backed chat model.

    Note that the CLI exposes no sampling controls: `temperature`, `top_p` and
    `top_k` are accepted for drop-in compatibility but ignored. Use `effort` or
    `thinking` instead. `stop` sequences are likewise unsupported.
    """

    model: str = "sonnet"
    max_turns: int | None = None
    effort: str | None = None
    thinking: dict[str, Any] | None = None
    cwd: str | None = None
    cli_path: str | None = None
    fallback_model: str | None = None
    max_budget_usd: float | None = None
    temperature: float | None = None

    @property
    def _llm_type(self):
        return "claude-cli"

    @property
    def _identifying_params(self):
        return {"model": self.model, "max_turns": self.max_turns}

    def bind_tools(self, tools, **kwargs):
        """Bind tool schemas so Claude can request them; execution stays with the caller."""
        return self.bind(tools=_tool_specs(tools), **kwargs)

    def _build_options(self, specs, system_prompt):
        """Assemble ClaudeAgentOptions for one turn."""
        options = {
            # Disable every built-in tool so only bound tools are reachable.
            "tools": [],
            "model": self.model,
            "system_prompt": system_prompt,
            "setting_sources": None,
            "strict_mcp_config": True,
        }
        if specs:
            server = create_sdk_mcp_server(
                name=MCP_SERVER_NAME,
                tools=[_make_stub(*spec) for spec in specs],
            )
            options["mcp_servers"] = {MCP_SERVER_NAME: server}
            # No allowed_tools: an entry allowing a whole tool auto-approves it
            # before the gate is consulted (CanUseToolShadowedWarning).
            options["hooks"] = {
                "PreToolUse": [HookMatcher(matcher=None, hooks=[self._gate])]
            }
        for key in ("max_turns", "cwd", "cli_path", "fallback_model", "max_budget_usd",
                    "effort", "thinking"):
            value = getattr(self, key)
            if value is not None:
                options[key] = value
        return ClaudeAgentOptions(**options)

    async def _gate(self, input_data, tool_use_id, context):
        """PreToolUse hook: deny execution and end the turn."""
        return _DENY_AND_STOP

    async def _agenerate(self, messages, stop=None, run_manager=None, **kwargs):
        specs = kwargs.get("tools") or []
        system_prompt, prompt = _render_messages(messages)
        options = self._build_options(specs, system_prompt)

        async def stream():
            yield {
                "type": "user",
                "message": {"role": "user", "content": prompt},
                "parent_tool_use_id": None,
                "session_id": "default",
            }

        texts, tool_calls, result = [], [], None
        try:
            async for message in query(prompt=stream(), options=options):
                if isinstance(message, AssistantMessage):
                    for block in message.content:
                        if isinstance(block, ToolUseBlock):
                            tool_calls.append(
                                {
                                    "name": block.name.removeprefix(TOOL_PREFIX),
                                    "args": block.input or {},
                                    "id": block.id,
                                    "type": "tool_call",
                                }
                            )
                        elif isinstance(block, TextBlock):
                            texts.append(block.text)
                elif isinstance(message, ResultMessage):
                    result = message
        except CLINotFoundError as error:
            raise RuntimeError(
                "The `claude` CLI was not found. Install it and ensure it is on PATH, "
                "or set cli_path."
            ) from error
        except Exception:
            # Ending the turn on a captured tool call can surface as a transport
            # error; only treat it as fatal when nothing usable came back.
            if not tool_calls and not texts:
                raise

        if result is not None and result.is_error and not tool_calls and not texts:
            raise RuntimeError(f"Claude CLI returned an error result: {result.result}")

        response_metadata = {"model": self.model}
        if result is not None:
            response_metadata["stop_reason"] = result.stop_reason
            response_metadata["total_cost_usd"] = result.total_cost_usd
            response_metadata["num_turns"] = result.num_turns

        message = AIMessage(
            content="" if tool_calls else "\n".join(texts),
            tool_calls=tool_calls,
            response_metadata=response_metadata,
            usage_metadata=_usage_metadata(result.usage if result else None),
        )
        return ChatResult(generations=[ChatGeneration(message=message)])

    def _generate(self, messages, stop=None, run_manager=None, **kwargs):
        async def run():
            return await self._agenerate(messages, stop=stop, **kwargs)

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            return anyio.run(run)

        # Already inside an event loop: anyio.run would raise, so use a worker
        # thread with a loop of its own.
        with ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(anyio.run, run).result()


__all__ = ["ClaudeCLIModelWithTools"]
