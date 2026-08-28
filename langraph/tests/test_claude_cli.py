from unittest.mock import patch

import anyio
import pytest
from claude_agent_sdk import (
    AssistantMessage,
    CLINotFoundError,
    ResultMessage,
    TextBlock,
    ThinkingBlock,
    ToolUseBlock,
)
from langchain_core.messages import (
    AIMessage,
    ChatMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool

from langraph.models.claude_cli import (
    TOOL_PREFIX,
    ClaudeCLIModelWithTools,
    _authentication_failure,
    _block_text,
    _make_stub,
    _render_messages,
    _tool_specs,
)


@tool
def sample_tool(city: str) -> str:
    """Look up a city."""
    return city


def make_result(is_error=False, usage=None, result=None):
    return ResultMessage(
        subtype="success",
        duration_ms=10,
        duration_api_ms=5,
        is_error=is_error,
        num_turns=1,
        session_id="s1",
        stop_reason="end_turn",
        total_cost_usd=0.01,
        usage=usage,
        result=result,
    )


def fake_query(messages=None, raises=None):
    """Build a stand-in for claude_agent_sdk.query yielding the given messages."""
    captured = {}

    def _query(prompt, options):
        captured["options"] = options

        async def _stream():
            for message in messages or []:
                yield message
            if raises is not None:
                raise raises

        return _stream()

    return _query, captured


def test_generate_returns_text_and_usage():
    query, captured = fake_query([
        AssistantMessage(content=[TextBlock(text="PONG")], model="sonnet"),
        make_result(usage={"input_tokens": 3, "output_tokens": 4}),
    ])
    with patch("langraph.models.claude_cli.query", query):
        message = ClaudeCLIModelWithTools().invoke([HumanMessage("ping")])

    assert message.content == "PONG"
    assert message.tool_calls == []
    assert message.usage_metadata == {
        "input_tokens": 3,
        "output_tokens": 4,
        "total_tokens": 7,
        "input_token_details": {"cache_read": 0, "cache_creation": 0},
    }
    assert message.response_metadata["stop_reason"] == "end_turn"
    assert message.response_metadata["total_cost_usd"] == 0.01
    # Built-in tools are disabled so only bound tools are ever reachable.
    assert captured["options"].tools == []


def test_cached_input_counts_towards_input_tokens():
    # Anthropic leaves only the uncached remainder in `input_tokens`, so counting that
    # alone reported a 16k-token prompt as 2 and made LangSmith's cost data useless.
    query, _ = fake_query([
        AssistantMessage(content=[TextBlock(text="PONG")], model="opus"),
        make_result(usage={
            "input_tokens": 2,
            "cache_read_input_tokens": 15000,
            "cache_creation_input_tokens": 1200,
            "output_tokens": 40602,
        }),
    ])
    with patch("langraph.models.claude_cli.query", query):
        message = ClaudeCLIModelWithTools().invoke([HumanMessage("ping")])

    assert message.usage_metadata == {
        "input_tokens": 16202,
        "output_tokens": 40602,
        "total_tokens": 56804,
        "input_token_details": {"cache_read": 15000, "cache_creation": 1200},
    }


def test_generate_returns_tool_calls_with_prefix_stripped():
    query, _ = fake_query([
        AssistantMessage(
            content=[ToolUseBlock(id="t1", name=f"{TOOL_PREFIX}sample_tool",
                                  input={"city": "Tokyo"})],
            model="sonnet",
        ),
        make_result(),
    ])
    with patch("langraph.models.claude_cli.query", query):
        message = ClaudeCLIModelWithTools().bind_tools([sample_tool]).invoke("weather?")

    assert message.tool_calls == [
        {"name": "sample_tool", "args": {"city": "Tokyo"}, "id": "t1", "type": "tool_call"}
    ]
    assert message.content == ""


def test_bound_tools_register_a_gate():
    query, captured = fake_query([make_result()])
    with patch("langraph.models.claude_cli.query", query):
        ClaudeCLIModelWithTools().bind_tools([sample_tool]).invoke("hi")
    options = captured["options"]

    assert "langchain" in options.mcp_servers
    assert "PreToolUse" in options.hooks
    # allowed_tools would auto-approve the call before the gate is consulted.
    assert options.allowed_tools == []


def test_unbound_model_registers_no_tooling():
    query, captured = fake_query([make_result()])
    with patch("langraph.models.claude_cli.query", query):
        ClaudeCLIModelWithTools().invoke("hi")

    assert captured["options"].mcp_servers == {}
    assert captured["options"].hooks is None


def test_optional_settings_are_forwarded():
    query, captured = fake_query([make_result()])
    model = ClaudeCLIModelWithTools(model="opus", max_turns=3, cwd="/tmp", effort="high")
    with patch("langraph.models.claude_cli.query", query):
        model.invoke("hi")
    options = captured["options"]

    assert options.model == "opus"
    assert options.max_turns == 3
    assert options.cwd == "/tmp"
    assert options.effort == "high"


def test_error_after_a_tool_call_is_not_fatal():
    query, _ = fake_query(
        [
            AssistantMessage(
                content=[ToolUseBlock(id="t1", name=f"{TOOL_PREFIX}sample_tool", input={})],
                model="sonnet",
            )
        ],
        raises=Exception("transport closed"),
    )
    with patch("langraph.models.claude_cli.query", query):
        message = ClaudeCLIModelWithTools().bind_tools([sample_tool]).invoke("hi")

    assert message.tool_calls[0]["name"] == "sample_tool"


def test_error_without_output_is_raised():
    query, _ = fake_query([], raises=Exception("transport closed"))
    with (
        patch("langraph.models.claude_cli.query", query),
        pytest.raises(Exception, match="transport closed"),
    ):
        ClaudeCLIModelWithTools().invoke("hi")


def test_error_result_without_output_is_raised():
    query, _ = fake_query([make_result(is_error=True, result="boom")])
    with (
        patch("langraph.models.claude_cli.query", query),
        pytest.raises(RuntimeError, match="boom"),
    ):
        ClaudeCLIModelWithTools().invoke("hi")


def test_missing_cli_reports_a_clear_error():
    query, _ = fake_query([], raises=CLINotFoundError("not found"))
    with (
        patch("langraph.models.claude_cli.query", query),
        pytest.raises(RuntimeError, match="was not found"),
    ):
        ClaudeCLIModelWithTools().invoke("hi")


def test_generate_works_inside_a_running_event_loop():
    query, _ = fake_query([
        AssistantMessage(content=[TextBlock(text="ok")], model="sonnet"),
        make_result(),
    ])

    async def call():
        # anyio.run would raise here, so _generate must hand off to a worker thread.
        return ClaudeCLIModelWithTools().invoke("hi")

    with patch("langraph.models.claude_cli.query", query):
        assert anyio.run(call).content == "ok"


def test_render_messages_passes_a_lone_human_message_through():
    system, prompt = _render_messages([HumanMessage("just this")])

    assert system is None
    assert prompt == "just this"


def test_render_messages_extracts_the_system_prompt():
    system, prompt = _render_messages([SystemMessage("be terse"), HumanMessage("hi")])

    assert system == "be terse"
    assert prompt == "hi"


def test_render_messages_builds_a_transcript_for_multi_turn():
    _, prompt = _render_messages([
        HumanMessage("weather?"),
        AIMessage(
            content="",
            tool_calls=[{"name": "sample_tool", "args": {"city": "Tokyo"},
                         "id": "t1", "type": "tool_call"}],
        ),
        ToolMessage(content='{"temp": 21}', tool_call_id="t1", name="sample_tool"),
    ])

    assert "## User\nweather?" in prompt
    assert "Called tool `sample_tool`" in prompt
    assert "'city': 'Tokyo'" in prompt
    assert '## Result of tool `sample_tool`\n{"temp": 21}' in prompt


def test_render_messages_omits_oversized_tool_args():
    """Bulky args (the forecast JSON) must not be replayed into later prompts."""
    content = "x" * 5000
    _, prompt = _render_messages([
        HumanMessage("score it"),
        AIMessage(
            content="",
            tool_calls=[{"name": "write_file",
                         "args": {"file_path": "out.json", "content": content},
                         "id": "t1", "type": "tool_call"}],
        ),
        ToolMessage(content="Written to out.json", tool_call_id="t1", name="write_file"),
    ])

    assert content not in prompt
    assert "<5000 chars omitted>" in prompt
    # Small args stay readable, and the tool result is untouched.
    assert "'file_path': 'out.json'" in prompt
    assert "## Result of tool `write_file`\nWritten to out.json" in prompt


@pytest.mark.parametrize(
    ("content", "expected"),
    [
        ("plain", "plain"),
        (["a", {"text": "b"}, {"type": "image"}], "a\nb"),
        (42, "42"),
    ],
)
def test_block_text_flattens_provider_content_shapes(content, expected):
    assert _block_text(content) == expected


def test_gate_denies_and_ends_the_turn():
    async def call():
        return await ClaudeCLIModelWithTools()._gate({}, None, None)

    decision = anyio.run(call)

    assert decision["hookSpecificOutput"]["permissionDecision"] == "deny"
    assert decision["continue"] is False


def test_stub_handler_reports_an_error_if_ever_reached():
    stub = _make_stub("curl", "Fetch a URL.", {"type": "object", "properties": {}})

    async def call():
        return await stub.handler({})

    outcome = anyio.run(call)

    assert outcome["is_error"] is True
    assert "must be executed by the caller" in outcome["content"][0]["text"]


def test_rendered_prompt_is_sent_to_the_cli():
    sent = {}

    def query(prompt, options):
        async def _stream():
            sent["messages"] = [message async for message in prompt]
            yield make_result()

        return _stream()

    with patch("langraph.models.claude_cli.query", query):
        ClaudeCLIModelWithTools().invoke([SystemMessage("be terse"), HumanMessage("ping")])

    assert sent["messages"][0]["message"]["content"] == "ping"
    assert sent["messages"][0]["type"] == "user"


def test_render_messages_falls_back_for_unknown_message_types():
    _, prompt = _render_messages([HumanMessage("hi"), ChatMessage(role="critic", content="meh")])

    assert prompt.endswith("meh")


def test_tool_specs_converts_langchain_tools():
    [(name, description, schema)] = _tool_specs([sample_tool])

    assert name == "sample_tool"
    assert description == "Look up a city."
    assert schema["properties"]["city"]["type"] == "string"


def test_a_turn_with_no_output_returns_empty_content_and_warns(caplog):
    # Current behaviour, pinned deliberately: the SDK does not call this an error,
    # so it leaves as `content=""` and only fails wherever that string is parsed.
    # The warning is the only place the turn can still describe itself.
    query, _ = fake_query([make_result()])
    with patch("langraph.models.claude_cli.query", query), caplog.at_level("WARNING"):
        message = ClaudeCLIModelWithTools().invoke("hi")

    assert message.content == ""
    assert message.tool_calls == []
    assert "no text and no tool calls" in caplog.text
    assert "stop_reason=end_turn" in caplog.text
    assert "blocks=none" in caplog.text


def test_a_turn_that_only_thought_is_reported_as_thinking(caplog):
    query, _ = fake_query(
        [
            AssistantMessage(
                content=[ThinkingBlock(thinking="hmm", signature="sig")],
                model="sonnet",
            ),
            make_result(),
        ]
    )
    with patch("langraph.models.claude_cli.query", query), caplog.at_level("WARNING"):
        message = ClaudeCLIModelWithTools().invoke("hi")

    assert message.content == ""
    assert "ThinkingBlock" in caplog.text
    assert message.response_metadata["block_types"] == {"ThinkingBlock": 1}


def test_block_types_are_tallied_for_a_normal_turn():
    query, _ = fake_query(
        [
            AssistantMessage(content=[TextBlock(text="hi"), TextBlock(text="there")],
                             model="sonnet"),
            make_result(),
        ]
    )
    with patch("langraph.models.claude_cli.query", query):
        message = ClaudeCLIModelWithTools().invoke("hi")

    assert message.response_metadata["block_types"] == {"TextBlock": 2}


def _text_turn(text):
    return fake_query(
        [AssistantMessage(content=[TextBlock(text=text)], model="sonnet"), make_result()]
    )


def test_an_expired_login_is_named_rather_than_returned_as_an_answer():
    # The real one, verbatim from the forecast CronJob: it used to travel on as
    # `content` and fail as "not valid JSON" wherever it was parsed.
    query, _ = _text_turn(
        "Failed to authenticate: OAuth session expired and could not be refreshed"
    )
    with (
        patch("langraph.models.claude_cli.query", query),
        pytest.raises(RuntimeError, match="not authenticated"),
    ):
        ClaudeCLIModelWithTools().invoke("hi")


def test_the_authentication_error_repeats_what_the_cli_said():
    query, _ = _text_turn("Invalid API key · Please run /login")
    with (
        patch("langraph.models.claude_cli.query", query),
        pytest.raises(RuntimeError, match=r"Invalid API key . Please run /login"),
    ):
        ClaudeCLIModelWithTools().invoke("hi")


def test_a_normal_answer_is_not_mistaken_for_an_authentication_failure():
    query, _ = _text_turn('{"fields":["time"],"rows":[]}')
    with patch("langraph.models.claude_cli.query", query):
        assert ClaudeCLIModelWithTools().invoke("hi").content == (
            '{"fields":["time"],"rows":[]}'
        )


@pytest.mark.parametrize(
    "text",
    [
        "",
        "here are the rows you asked for",
        # Long enough to be an answer about authentication rather than a failure.
        "failed to authenticate " + "x" * 400,
    ],
)
def test_authentication_failure_ignores_text_that_is_not_the_cli_complaining(text):
    assert _authentication_failure(text) is False


@pytest.mark.parametrize(
    "text",
    [
        "Failed to authenticate: OAuth session expired and could not be refreshed",
        "OAuth session expired",
        "Please run /login",
        "Invalid API key",
        "authentication_error",
    ],
)
def test_authentication_failure_recognises_the_cli_phrasings(text):
    assert _authentication_failure(text) is True
