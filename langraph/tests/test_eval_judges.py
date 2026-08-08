"""Tests for the LLM judges and the model they grade with.

`conftest.py` already stubs `langraph.models.score_llm`, so `build_judge` is
checked by what it asks that stub for rather than by reaching a provider. The
evaluators themselves take an injected judge, so nothing here makes a call.
"""

import json
from unittest.mock import MagicMock

import pytest

from langraph.evals.evaluators.judges import (
    JUDGE_EFFORT,
    JUDGE_MODEL,
    JUDGE_PROVIDER,
    JUDGE_SAMPLE,
    build_judge,
    judge_spec,
    make_analysis_quality_judge,
    make_score_plausibility_judge,
)
from langraph.tests.eval_builders import INPUTS, find, forecast, outputs_for

PLAUSIBLE = {"plausible": True, "why": "The worst factor is ideal."}
IMPLAUSIBLE = {"plausible": False, "why": "A marginal wind cannot score 85."}
GOOD_PROSE = {
    "names_deciding_factor": True, "identifies_best_window": True,
    "activity_specific": True, "why": "Names the wind and the morning window.",
}
POOR_PROSE = {**GOOD_PROSE, "identifies_best_window": False, "why": "No window given."}


def fake_judge(*answers):
    """A judge replying with each answer in turn, then repeating the last."""
    replies = [MagicMock(content=json.dumps(answer)) for answer in answers]
    judge = MagicMock()
    judge.invoke.side_effect = lambda _: replies.pop(0) if len(replies) > 1 \
        else replies[0]
    return judge


@pytest.mark.parametrize(("given", "expected"), [
    ((None, None, None), (JUDGE_PROVIDER, JUDGE_MODEL, JUDGE_EFFORT)),
    (("xai", None, None), ("xai", JUDGE_MODEL, JUDGE_EFFORT)),
    ((None, None, "low"), (JUDGE_PROVIDER, JUDGE_MODEL, "low")),
    (("claude-cli", "opus", "medium"), ("claude-cli", "opus", "medium")),
])
def test_judge_spec_fills_in_what_a_spec_left_out(given, expected):
    assert judge_spec(*given) == expected


def test_build_judge_never_leaves_a_part_for_the_environment_to_fill():
    # `build_score_llm` reads LANGGRAPH_SCORE_MODEL and LANGGRAPH_SCORE_EFFORT
    # for any argument left None, which would hand the judge the very settings
    # it was asked to grade.
    from langraph.models.score_llm import build_score_llm

    build_score_llm.reset_mock()
    build_judge()

    assert build_score_llm.call_args.args == (JUDGE_PROVIDER, JUDGE_MODEL, JUDGE_EFFORT)
    assert not build_score_llm.call_args.kwargs


def test_build_judge_forwards_the_spec_it_was_given():
    from langraph.models.score_llm import build_score_llm

    build_score_llm.reset_mock()
    build_judge("claude-cli", "opus", "medium")

    assert build_score_llm.call_args.args == ("claude-cli", "opus", "medium")


def test_the_default_judge_is_capable_enough_to_grade_prose():
    # `analysis_quality` asks for taste no rule supplies, so the default is a
    # reasoning model at a real effort rather than the cheapest thing that
    # answers.
    assert JUDGE_EFFORT in ("medium", "high")
    assert "lite" not in JUDGE_MODEL


def test_the_default_judge_is_not_the_provider_the_scorer_runs_on():
    # A judge of the same family marks generously, which skews a sweep more than
    # a weak judge does. `build_score_llm` falls back to this provider when the
    # environment names none, so a default judge sharing it would grade its own
    # family without the spec ever saying so.
    assert JUDGE_PROVIDER != "openrouter"


def test_score_plausibility_averages_the_verdicts():
    evaluate = make_score_plausibility_judge(
        fake_judge(PLAUSIBLE, IMPLAUSIBLE, PLAUSIBLE), sample=3
    )

    result = evaluate(INPUTS, outputs_for(forecast()))

    assert find(result, "score_plausibility")["score"] == pytest.approx(2 / 3)
    assert "marginal wind" in find(result, "score_plausibility")["comment"]


def test_analysis_quality_marks_each_question_it_asked():
    evaluate = make_analysis_quality_judge(fake_judge(POOR_PROSE), sample=2)

    result = evaluate(INPUTS, outputs_for(forecast()))

    # Two of three questions answered yes, on both sampled entries.
    assert find(result, "analysis_quality")["score"] == pytest.approx(2 / 3)


def test_both_judges_grade_the_same_number_of_entries_by_default():
    # Which is what puts them on the same entries: `_sample` spaces its picks by
    # `len(entries) // count`, so unequal counts read two different slices, and
    # the entry one judge objects to is then usually one the other never saw.
    plausibility, quality = fake_judge(PLAUSIBLE), fake_judge(POOR_PROSE)
    outputs = outputs_for(forecast())

    make_score_plausibility_judge(plausibility)(INPUTS, outputs)
    make_analysis_quality_judge(quality)(INPUTS, outputs)

    assert plausibility.invoke.call_count == JUDGE_SAMPLE
    assert quality.invoke.call_count == JUDGE_SAMPLE


@pytest.mark.parametrize(("make", "key"), [
    (make_score_plausibility_judge, "score_plausibility"),
    (make_analysis_quality_judge, "analysis_quality"),
])
def test_a_broken_judge_reports_no_grade_rather_than_a_zero(make, key):
    # The answer under test is still whatever it was. Scoring it zero because
    # the examiner fell over would read as a failure of the model being graded.
    judge = MagicMock()
    judge.invoke.side_effect = RuntimeError("429 rate limited")

    result = make(judge, sample=2)(INPUTS, outputs_for(forecast()))

    assert find(result, key)["score"] is None
    assert "RuntimeError" in find(result, key)["comment"]


@pytest.mark.parametrize(("make", "key"), [
    (make_score_plausibility_judge, "score_plausibility"),
    (make_analysis_quality_judge, "analysis_quality"),
])
def test_nothing_scored_is_not_something_to_grade(make, key):
    judge = MagicMock()

    result = make(judge, sample=2)(INPUTS, outputs_for({}))

    assert find(result, key)["score"] is None
    judge.invoke.assert_not_called()
