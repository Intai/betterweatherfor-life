"""Tests for the eval CLI's argument handling.

Only the pure parsing helpers — every command defers its imports until after the
environment is loaded, so nothing here reaches a model or LangSmith.
"""

from unittest.mock import MagicMock

import pytest

from langraph.evals.cli import _each_model, _model_specs, _parse_spec, build_parser


@pytest.mark.parametrize(("spec", "expected"), [
    ("xai", ("xai", None, None)),
    ("gemini=medium", ("gemini", None, "medium")),
    ("xai:grok-4.20-reasoning", ("xai", "grok-4.20-reasoning", None)),
    ("gemini:gemini-3.1-pro-preview=low", ("gemini", "gemini-3.1-pro-preview", "low")),
    ("  xai = low  ", ("xai", None, "low")),
])
def test_parse_spec_reads_each_part(spec, expected):
    assert _parse_spec(spec) == expected


def test_parse_spec_keeps_a_colon_inside_a_model_name():
    # This project's own OpenRouter default carries a `:free` suffix. Splitting
    # the spec on colons would drop it and read `free` as the reasoning effort,
    # quietly evaluating the paid model with a nonsense knob.
    provider, model, effort = _parse_spec(
        "openrouter:nvidia/nemotron-3-ultra-550b-a55b:free=low"
    )

    assert provider == "openrouter"
    assert model == "nvidia/nemotron-3-ultra-550b-a55b:free"
    assert effort == "low"


@pytest.mark.parametrize(("values", "expected"), [
    (None, []),
    (["xai=low,gemini=medium"], ["xai=low", "gemini=medium"]),
    (["xai=low", "gemini=medium"], ["xai=low", "gemini=medium"]),
    (["xai=low, gemini=medium ,,"], ["xai=low", "gemini=medium"]),
])
def test_model_specs_accepts_commas_or_repeats(values, expected):
    assert _model_specs(values) == expected


def test_each_model_builds_one_model_per_spec():
    # Built once here and handed to the target, because a sweep that re-read the
    # environment would measure one model and label the results with another.
    built = []

    def build(provider, model, effort):
        built.append((provider, model, effort))
        return MagicMock()

    rows = list(_each_model(["xai=low", "gemini=medium"], build))

    assert built == [("xai", None, "low"), ("gemini", None, "medium")]
    assert [label for _, label, _ in rows] == ["xai-low", "gemini-medium"]
    assert all(llm is not None for llm, _, _ in rows)


def test_each_model_leaves_the_singleton_alone_without_a_spec():
    build = MagicMock()

    (llm, label, parts), = _each_model([None], build)

    assert llm is None
    assert label == "default"
    assert parts == (None, None, None)
    build.assert_not_called()


def test_each_model_makes_a_label_safe_for_an_experiment_name():
    rows = list(_each_model(
        ["openrouter:nvidia/nemotron-3-ultra-550b-a55b:free=low"], lambda *a: MagicMock()
    ))
    assert "/" not in rows[0][1]


@pytest.mark.parametrize("command", ["fetch", "score"])
def test_both_evaluated_suites_sweep_models(command):
    args = build_parser().parse_args(
        [command, *(["--source", "marine"] if command == "fetch" else []),
         "--models", "xai=low,gemini=medium"]
    )
    assert _model_specs(args.models) == ["xai=low", "gemini=medium"]


@pytest.mark.parametrize(("argv", "expected"), [
    ([], None),
    (["--judge"], ""),
    (["--judge", "claude-cli:opus=medium"], "claude-cli:opus=medium"),
    (["--judge", "xai"], "xai"),
])
def test_judge_opts_in_by_being_present_and_names_the_examiner_by_its_value(
    argv, expected
):
    # One flag rather than two: `None` is off, and anything else is on.
    assert build_parser().parse_args(["score", *argv]).judge == expected


def test_a_bare_judge_does_not_swallow_the_next_flag():
    # The risk of an optional value. Safe only because this subparser has no
    # positionals for argparse to offer the value to.
    args = build_parser().parse_args(["score", "--judge", "--activity", "sup"])

    assert args.judge == ""
    assert args.activity == "sup"


@pytest.mark.parametrize(("argv", "expected"), [
    ([], None),
    (["--judge", "--judge-sample", "8"], 8),
    (["--judge-sample", "1"], 1),
])
def test_judge_sample_widens_what_the_judges_grade(argv, expected):
    # None rather than 3, because the two judges default to different sizes and
    # only the factories know which is which.
    assert build_parser().parse_args(["score", *argv]).judge_sample == expected


@pytest.mark.parametrize("size", ["0", "-1"])
def test_a_judge_sample_below_one_is_refused_at_the_command_line(size):
    # `_sample` divides by it, so a zero would raise after the run had been paid
    # for rather than before it started.
    with pytest.raises(SystemExit):
        build_parser().parse_args(["score", "--judge", "--judge-sample", size])


def test_a_judge_spec_parses_like_a_model_spec():
    # Deliberately the same grammar as `--models`, down to the `=` for effort.
    assert _parse_spec("claude-cli:opus=medium") == ("claude-cli", "opus", "medium")
    assert _parse_spec("") == (None, None, None)


def test_the_end_to_end_suite_takes_no_models():
    # It would pay for the whole fetch phase once per model, and the live data
    # drifting underneath would confound the comparison anyway.
    with pytest.raises(SystemExit):
        build_parser().parse_args(["e2e", "--models", "xai=low"])
