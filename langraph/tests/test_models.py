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
        assert mock_cls.call_args[1]["temperature"] == 0
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
        assert mock_cls.call_args[1]["model"] == "gemini-3.6-flash"
        assert mock_cls.call_args[1]["max_output_tokens"] == 32000
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
        assert mock_cls.call_args[1]["max_tokens"] == 32000
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
        assert mock_cls.call_args[1]["max_tokens"] == 32000
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())
