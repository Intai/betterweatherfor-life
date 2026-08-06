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
        assert mock_cls.call_args[1]["model"] == "gemini-3.5-flash-lite"
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
        assert mock_cls.call_args[1]["model"] == "grok-4.3-latest"
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
        assert mock_cls.call_args[1]["max_output_tokens"] == 64000
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
        assert mock_cls.call_args[1]["model"] == "grok-4.20-reasoning"
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
        assert mock_cls.call_args[1]["model"] == "nvidia/nemotron-3-super-120b-a12b:free"
        assert mock_cls.call_args[1]["temperature"] == 0
        assert mock_cls.call_args[1]["max_tokens"] == 48000
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


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


def test_fetch_llm_xai_only_sends_effort_when_asked():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with (
        patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False),
        patch("langchain_xai.ChatXAI", mock_cls),
    ):
        import langraph.models.fetch_llm
        importlib.reload(langraph.models.fetch_llm)
        # Several grok models reject `reasoning_effort` outright, so an unset env
        # must not put it on the request at all.
        assert "extra_body" not in mock_cls.call_args[1]

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
