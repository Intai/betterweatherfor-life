import importlib
import sys
from unittest.mock import patch, MagicMock


def test_fetch_llm_default_gemini():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "gemini"}, clear=False):
        with patch("langchain_google_genai.ChatGoogleGenerativeAI", mock_cls):
            import langraph.models.fetch_llm
            mock_cls.assert_called_once()
            assert mock_cls.call_args[1]["model"] == "gemini-3-flash-preview"
            assert mock_cls.call_args[1]["temperature"] == 0
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_fetch_llm_xai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.fetch_llm", None)
    with patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False):
        with patch("langchain_xai.ChatXAI", mock_cls):
            import langraph.models.fetch_llm
            importlib.reload(langraph.models.fetch_llm)
            # Called once by import, once by reload
            assert mock_cls.call_count >= 1
            assert mock_cls.call_args[1]["model"] == "grok-4-1-fast-reasoning"
    sys.modules["langraph.models.fetch_llm"] = MagicMock(fetch_llm=MagicMock())


def test_score_llm_default_gemini():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "gemini"}, clear=False):
        with patch("langchain_google_genai.ChatGoogleGenerativeAI", mock_cls):
            import langraph.models.score_llm
            mock_cls.assert_called_once()
            assert mock_cls.call_args[1]["model"] == "gemini-3.1-pro-preview"
            assert mock_cls.call_args[1]["temperature"] == 0
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())


def test_score_llm_xai():
    mock_cls = MagicMock()
    sys.modules.pop("langraph.models.score_llm", None)
    with patch.dict("os.environ", {"LANGGRAPH_LLM_PROVIDER": "xai"}, clear=False):
        with patch("langchain_xai.ChatXAI", mock_cls):
            import langraph.models.score_llm
            importlib.reload(langraph.models.score_llm)
            assert mock_cls.call_count >= 1
            assert mock_cls.call_args[1]["model"] == "grok-4.20-reasoning"
    sys.modules["langraph.models.score_llm"] = MagicMock(score_llm=MagicMock())
