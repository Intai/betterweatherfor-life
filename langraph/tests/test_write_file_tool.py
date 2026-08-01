from unittest.mock import mock_open, patch

from langraph.tools.write_file_tool import write_file


def test_successful_write():
    m = mock_open()
    with patch("builtins.open", m):
        result = write_file.invoke({"file_path": "/tmp/test.json", "content": '{"a":1}'})
    m.assert_called_once_with("/tmp/test.json", "w")
    m().write.assert_called_once_with('{"a":1}')
    assert result == "Written to /tmp/test.json"


def test_io_error():
    with patch("builtins.open", side_effect=OSError("permission denied")):
        try:
            write_file.invoke({"file_path": "/root/test.json", "content": "data"})
            assert False, "Should have raised"
        except OSError:
            pass
