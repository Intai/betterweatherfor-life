import subprocess
from unittest.mock import MagicMock, patch

from langraph.tools.curl_tool import curl


def test_get_request():
    mock_result = MagicMock(stdout="response data", stderr="")
    with patch("langraph.tools.curl_tool.subprocess.run", return_value=mock_result) as mock_run:
        result = curl.invoke({"url": "http://example.com"})
        mock_run.assert_called_once_with(
            ["curl", "-s", "-f", "-X", "GET", "http://example.com"],
            capture_output=True, text=True, timeout=30, check=False,
        )
        assert result == "response data"


def test_post_with_data():
    mock_result = MagicMock(stdout="ok", stderr="")
    with patch("langraph.tools.curl_tool.subprocess.run", return_value=mock_result) as mock_run:
        result = curl.invoke({"url": "http://example.com", "method": "POST", "data": '{"key": "val"}'})
        args = mock_run.call_args[0][0]
        assert "-X" in args
        assert "POST" in args
        assert "-d" in args
        assert '{"key": "val"}' in args
        assert result == "ok"


def test_custom_headers():
    mock_result = MagicMock(stdout="ok", stderr="")
    with patch("langraph.tools.curl_tool.subprocess.run", return_value=mock_result) as mock_run:
        curl.invoke({
            "url": "http://example.com",
            "headers": {"accept": "text/csv", "auth": "Bearer tok"},
        })
        args = mock_run.call_args[0][0]
        h_indices = [i for i, a in enumerate(args) if a == "-H"]
        assert len(h_indices) == 2
        assert "accept: text/csv" in args
        assert "auth: Bearer tok" in args


def test_returns_stderr_when_stdout_empty():
    mock_result = MagicMock(stdout="", stderr="error msg")
    with patch("langraph.tools.curl_tool.subprocess.run", return_value=mock_result):
        result = curl.invoke({"url": "http://example.com"})
        assert result == "error msg"


def test_timeout_propagates():
    with patch(
        "langraph.tools.curl_tool.subprocess.run",
        side_effect=subprocess.TimeoutExpired(cmd="curl", timeout=30),
    ):
        try:
            curl.invoke({"url": "http://example.com"})
            assert False, "Should have raised"
        except subprocess.TimeoutExpired:
            pass


def test_no_headers_no_data():
    mock_result = MagicMock(stdout="ok", stderr="")
    with patch("langraph.tools.curl_tool.subprocess.run", return_value=mock_result) as mock_run:
        curl.invoke({"url": "http://example.com", "method": "DELETE"})
        args = mock_run.call_args[0][0]
        assert "-H" not in args
        assert "-d" not in args
        assert "DELETE" in args
