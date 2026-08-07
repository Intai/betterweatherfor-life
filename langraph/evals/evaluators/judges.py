"""The two checks a rule cannot make, handed to a model instead.

Opt-in, because they roughly double the cost of an experiment and are the least
reliable signal in it — the rule-based catalogue already covers most of what
"quality" means for a scored forecast. Both sample a few entries rather than
judging all forty: judging every entry costs more than producing them did.

The judge is deliberately not the model under test, and `--judge` moves it. Three
things decide what to point it at:

- Capability is bought mainly for `analysis_quality`, which asks for taste no
  rule can supply. `score_plausibility` applies stated numeric bands, where a
  larger model only buys fewer arithmetic slips.
- It must sit outside the family under test. A model of the same family marks it
  generously, which skews a sweep more than a weak judge does — a weak judge is
  at least weak uniformly across every column. The default below sits outside
  every family the scorer sweeps by name, so the case for naming something else
  is a sweep of OpenAI models, which reach the scorer through OpenRouter.
- Fixed across a sweep beats strong. Consistency is what makes the columns
  comparable, so move the judge between sweeps rather than within one.
"""

import json

from langraph.evals.evaluators.common import metric
from langraph.evals.evaluators.score import _activity, _forecast, _scored
from langraph.utils.messages import extract_message_text, unfence

# Where `--judge` starts from, and where it lands when only part of a spec is given.
JUDGE_PROVIDER = "openai"
JUDGE_MODEL = "gpt-5.6-terra"
JUDGE_EFFORT = "medium"

PLAUSIBILITY_PROMPT = """\
You are checking one entry of an outdoor activity forecast against the rules it \
was scored under. Judge only what the rules say — not your own taste.

Rules:
- Condition bands: ideal 80-100, acceptable 60-79, marginal 40-59, unsuitable <40.
- The overall score is decided by the worst-case factor. If any factor is \
marginal, the score must be 40-59, and so on.
- For snorkelling only, `temp` is pinned to acceptable and never decides the score.

Activity: {activity}
Entry: {entry}

Answer with raw JSON only: {{"plausible": true or false, "why": "one sentence"}}
"""

QUALITY_PROMPT = """\
You are checking the written parts of one entry of an outdoor activity forecast.

Good writing here names the factor that actually decided the score, says what it \
means for this specific activity, and — in the analysis — identifies the best \
window to go. Generic labels like "unsuitable conditions", or a bare restatement \
of a measurement like "28% chance of rain", are failures.

Activity: {activity}
Score: {score}
Summary: {summary}
Analysis: {analysis}

Answer with raw JSON only: \
{{"names_deciding_factor": true or false, "identifies_best_window": true or false, \
"activity_specific": true or false, "why": "one sentence"}}
"""


def judge_spec(provider=None, model=None, effort=None):
    """Fill in whichever parts of a judge spec were left out.

    Args:
        provider: A provider `build_score_llm` understands, or None.
        model: That provider's own model name, or None.
        effort: A reasoning effort, or None.

    Returns:
        The `(provider, model, effort)` triple with no part left None.
    """
    return (provider or JUDGE_PROVIDER, model or JUDGE_MODEL,
            effort or JUDGE_EFFORT)


def build_judge(provider=None, model=None, effort=None):
    """Build the model that grades, which is never the model being graded.

    Every part is resolved before the call, because `build_score_llm` reads
    `LANGGRAPH_SCORE_MODEL` and `LANGGRAPH_SCORE_EFFORT` for anything left None
    — which would hand the judge the very settings it is meant to grade.

    Args:
        provider: A provider to grade with, or None for the default above.
        model: A model to grade with, or None for the default above.
        effort: A reasoning effort to grade at, or None for the default above.

    Returns:
        A new chat model.
    """
    from langraph.models.score_llm import build_score_llm

    return build_score_llm(*judge_spec(provider, model, effort))


def _sample(forecast, count):
    """Take a few entries deterministically, so two experiments judge the same ones.

    Sorted by key and evenly spaced rather than randomly drawn — `Math.random`'s
    Python equivalent would make repetitions incomparable.
    """
    entries = sorted(_scored(forecast).items())
    if not entries:
        return []
    step = max(len(entries) // count, 1)
    return entries[::step][:count]


def _ask(judge, prompt):
    """Ask the judge and read its JSON back, tolerating a fenced or broken reply.

    A judge that fails must not fail the row: the answer under test is still
    whatever it was, and a missing grade is more honest than a zero.
    """
    from langchain_core.messages import HumanMessage

    try:
        response = judge.invoke([HumanMessage(content=prompt)])
        return json.loads(unfence(extract_message_text(response.content)))
    except Exception as error:  # noqa: BLE001 — a flaky judge is not a failed answer
        return {"_error": f"{type(error).__name__}: {error}"}


def make_score_plausibility_judge(judge=None, sample=3):
    """Build an evaluator asking whether each sampled score follows from its factors.

    Args:
        judge: A chat model, or None to build the default one.
        sample: How many entries to judge per example.

    Returns:
        An evaluator taking `(inputs, outputs)`.
    """
    judge = judge or build_judge()

    def score_plausibility(inputs, outputs):
        activity = _activity(inputs, outputs)
        entries = _sample(_forecast(outputs), sample)
        if not entries:
            return metric("score_plausibility", None, "no scored entries to judge")

        verdicts, notes = [], []
        for key, entry in entries:
            answer = _ask(judge, PLAUSIBILITY_PROMPT.format(
                activity=activity, entry=json.dumps(entry, separators=(",", ":")),
            ))
            if "_error" in answer:
                notes.append(f"{key}: {answer['_error']}")
                continue
            verdicts.append(bool(answer.get("plausible")))
            if not answer.get("plausible"):
                notes.append(f"{key}: {answer.get('why')}")

        if not verdicts:
            return metric("score_plausibility", None, "; ".join(notes[:3]))
        return metric("score_plausibility", sum(verdicts) / len(verdicts),
                      "; ".join(notes[:3]) or None)

    return score_plausibility


def make_analysis_quality_judge(judge=None, sample=2):
    """Build an evaluator grading the prose that `summary_discipline` cannot count.

    Args:
        judge: A chat model, or None to build the default one.
        sample: How many entries to judge per example.

    Returns:
        An evaluator taking `(inputs, outputs)`.
    """
    judge = judge or build_judge()

    def analysis_quality(inputs, outputs):
        activity = _activity(inputs, outputs)
        entries = _sample(_forecast(outputs), sample)
        if not entries:
            return metric("analysis_quality", None, "no scored entries to judge")

        marks, notes = [], []
        for key, entry in entries:
            answer = _ask(judge, QUALITY_PROMPT.format(
                activity=activity, score=entry.get("score"),
                summary=entry.get("summary"), analysis=entry.get("analysis"),
            ))
            if "_error" in answer:
                notes.append(f"{key}: {answer['_error']}")
                continue
            asked = ("names_deciding_factor", "identifies_best_window",
                     "activity_specific")
            marks.append(sum(bool(answer.get(name)) for name in asked) / len(asked))
            if marks[-1] < 1 and answer.get("why"):
                notes.append(f"{key}: {answer['why']}")

        if not marks:
            return metric("analysis_quality", None, "; ".join(notes[:3]))
        return metric("analysis_quality", sum(marks) / len(marks),
                      "; ".join(notes[:3]) or None)

    return analysis_quality
