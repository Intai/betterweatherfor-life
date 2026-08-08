import importlib
import sys
from unittest.mock import MagicMock, patch


def test_fetch_llm_default_gemini():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "gemini"}, clear=False),
        patch("langchain_google_genai.ChatGoogleGenerativeAI", mock_cls),
    ):
        # Imported for its side effect: the module instantiates the LLM on import.
        import langraph.models.fetch_llm  # noqa: F401
        mock_cls.assert_called_once()
        assert mock_cls.call_args[1]["model"] == "gemini-3.5-flash"
        assert mock_cls.call_args[1]["max_output_tokens"] == 24000
        assert mock_cls.call_args[1]["reasoning_effort"] == "low"
        assert "temperature" not in mock_cls.call_args[1]
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_xai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        # Called once by import, once by reload
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "grok-4.5"
        assert mock_cls.call_args[1]["max_tokens"] == 24000
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_openrouter():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "openrouter"}, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "nvidia/nemotron-3-super-120b-a12b:free"
        assert mock_cls.call_args[1]["temperature"] == 0
        assert mock_cls.call_args[1]["max_tokens"] == 24000
        assert mock_cls.call_args[1]["extra_body"] == {"reasoning": {"enabled": False}}
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_claude_cli():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "claude-cli"}, clear=False),
        patch("langraph.models.claude_cli.ClaudeCLIModelWithTools", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "sonnet"
        assert mock_cls.call_args[1]["effort"] == "medium"
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_score_llm_claude_cli():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "claude-cli"}, clear=False),
        patch("langraph.models.claude_cli.ClaudeCLIModelWithTools", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "opus"
        assert mock_cls.call_args[1]["effort"] == "low"
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_default_gemini():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "gemini"}, clear=False),
        patch("langchain_google_genai.ChatGoogleGenerativeAI", mock_cls),
    ):
        # Imported for its side effect: the module instantiates the LLM on import.
        import langraph.models.score_llm  # noqa: F401
        mock_cls.assert_called_once()
        assert mock_cls.call_args[1]["model"] == "gemini-3.1-pro-preview"
        assert mock_cls.call_args[1]["max_output_tokens"] == 48000
        assert mock_cls.call_args[1]["temperature"] == 0
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_xai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "grok-4.5"
        assert mock_cls.call_args[1]["max_tokens"] == 48000
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_openrouter():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "openrouter"}, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "nvidia/nemotron-3-ultra-550b-a55b:free"
        assert mock_cls.call_args[1]["temperature"] == 0
        assert mock_cls.call_args[1]["max_tokens"] == 48000
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_openai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "openai"}, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "gpt-5.6-terra"
        assert mock_cls.call_args[1]["max_tokens"] == 48000
        # Both branches build the same class, so the absence of a base URL is what
        # says this one reached api.openai.com rather than the OpenRouter fallback.
        assert "base_url" not in mock_cls.call_args[1]
        # The GPT-5 family answers a 400 to any temperature but its own default.
        assert "temperature" not in mock_cls.call_args[1]
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_fetch_llm_openai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "openai"}, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        assert mock_cls.call_count >= 1
        assert mock_cls.call_args[1]["model"] == "gpt-5.6-luna"
        assert mock_cls.call_args[1]["max_tokens"] == 24000
        # Luna returns wrong tide times with reasoning off, so the effort is part of the
        # default rather than a knob — and an effort next to function tools only works
        # on the responses API.
        assert mock_cls.call_args[1]["reasoning_effort"] == "low"
        assert mock_cls.call_args[1]["use_responses_api"] is True
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_openai_none_effort_returns_to_chat_completions():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {
            "LANGGRAPH_LLM_PROVIDER": "openai",
            "LANGGRAPH_FETCH_EFFORT": "none",
        }, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        assert mock_cls.call_args[1]["reasoning_effort"] == "none"
        # `none` is the one effort chat completions accepts next to function tools, and
        # what terra wants — so it must not be dragged onto the responses API.
        assert mock_cls.call_args[1]["use_responses_api"] is False
        # Both branches build the same class, so the absence of a base URL is what
        # says this one reached api.openai.com rather than the OpenRouter fallback.
        assert "base_url" not in mock_cls.call_args[1]
        # The GPT-5 family answers a 400 to any temperature but its own default.
        assert "temperature" not in mock_cls.call_args[1]
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_env_overrides_gemini():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {
            "LANGGRAPH_LLM_PROVIDER": "gemini",
            "LANGGRAPH_FETCH_MODEL": "gemini-override",
            "LANGGRAPH_FETCH_EFFORT": "minimal",
        }, clear=False),
        patch("langchain_google_genai.ChatGoogleGenerativeAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        assert mock_cls.call_args[1]["model"] == "gemini-override"
        # Gemini 3 renamed the knob but kept the CLI's vocabulary, so it maps directly.
        assert mock_cls.call_args[1]["reasoning_effort"] == "minimal"
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_xai_always_sends_effort():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        # Low is grok-4.5's default here rather than an absent knob, so it rides on
        # every request — a model override naming a grok that rejects the knob 400s.
        assert mock_cls.call_args[1]["extra_body"] == {"reasoning_effort": "low"}

    with (
        patch.dict("os.environ", {
            "LANGGRAPH_LLM_PROVIDER": "xai",
            "LANGGRAPH_FETCH_EFFORT": "high",
        }, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        importlib.reload(langraph.models.fetch_llm)
        # xAI reads it from `extra_body`, not from a top-level field.
        assert mock_cls.call_args[1]["extra_body"] == {"reasoning_effort": "high"}
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_score_llm_env_overrides_openrouter():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {
            "LANGGRAPH_LLM_PROVIDER": "openrouter",
            "LANGGRAPH_SCORE_MODEL": "some/other-model",
            "LANGGRAPH_SCORE_EFFORT": "low",
        }, clear=False),
        patch("langchain_openai.ChatOpenAI", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_args[1]["model"] == "some/other-model"
        assert mock_cls.call_args[1]["reasoning_effort"] == "low"
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_xai_sends_effort_in_extra_body():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with (
        patch.dict("os.environ", {
            "LANGGRAPH_LLM_PROVIDER": "xai",
            "LANGGRAPH_SCORE_EFFORT": "medium",
        }, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        import langraph.models.score_llm
        importlib.reload(langraph.models.score_llm)
        assert mock_cls.call_args[1]["extra_body"] == {"reasoning_effort": "medium"}
        # The cache pin must survive alongside it.
        assert mock_cls.call_args[1]["default_headers"] == {
            "x-grok-conv-id": "betterweather-score"
        }
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())
