from langraph.utils.messages import extract_message_text


def test_string_input():
    assert extract_message_text("hello") == "hello"


def test_list_of_strings():
    assert extract_message_text(["a", "b"]) == "a\nb"


def test_list_of_dicts_with_text():
    content = [{"text": "first"}, {"text": "second"}]
    assert extract_message_text(content) == "first\nsecond"


def test_mixed_list():
    content = ["plain", {"text": "from dict"}]
    assert extract_message_text(content) == "plain\nfrom dict"


def test_dict_missing_text_key():
    content = [{"type": "image", "url": "img.png"}]
    assert extract_message_text(content) == ""


def test_empty_list():
    assert extract_message_text([]) == ""


def test_non_string_non_list():
    assert extract_message_text(42) == "42"


def test_dict_with_empty_text():
    content = [{"text": ""}]
    assert extract_message_text(content) == ""
