import pytest

from langraph.prompts.loader import load_prompt


def test_load_prompt_with_kwargs():
    result = load_prompt(
        "fetch_tides",
        latitude="-36.8",
        longitude="174.7",
        date="2026-03-24",
    )
    assert "-36.8" in result
    assert "174.7" in result
    assert "2026-03-24" in result


def test_load_prompt_missing_file():
    with pytest.raises(FileNotFoundError):
        load_prompt("nonexistent_template_xyz")


def test_load_prompt_missing_kwarg():
    with pytest.raises(KeyError):
        load_prompt("fetch_tides")
