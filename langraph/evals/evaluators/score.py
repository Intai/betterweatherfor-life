"""What a scored forecast is checked for, without a reference answer to compare to.

Every rule below mirrors `langraph/prompts/score.txt` — which factors each
activity carries, that the worst factor decides the entry, that snorkelling's
temperature never does. Change that prompt and these have to follow, or they will
keep reporting confident numbers against a contract nobody is asking for any more.

The thresholds are derived from `score_parser.py` rather than restated, so a
window or a condition band cannot be renamed in one place and missed in the other.
"""

import re

from langraph.evals.evaluators.common import metric, metrics, ratio
from langraph.utils.score_parser import (
    ALL_DAY,
    CONDITION_BANDS,
    FACTOR_FIELDS,
    FORECAST_WINDOWS,
    UNSUITABLE,
    WINDOW_HOURS,
    condition_for,
    forecast_dates,
)

# The five factors every activity carries. The rest are activity-specific, which
# is what `score.txt` spends three paragraphs on and what scorers keep getting
# wrong — cycling has written tide percentages, water activities have written
# humidity.
COMMON_FACTORS = frozenset({"wind", "precipitation", "temp", "daylight", "uv"})

EXPECTED_FACTORS = {
    "sup": COMMON_FACTORS | {"tide", "water"},
    "kayaking": COMMON_FACTORS | {"tide", "water"},
    "snorkelling": COMMON_FACTORS | {"tide", "water", "visibility"},
    "cycling": COMMON_FACTORS | {"humidity"},
}

# Derived, so a factor added to one activity cannot stay forbidden by omission.
FORBIDDEN_FACTORS = {
    activity: frozenset(FACTOR_FIELDS) - expected
    for activity, expected in EXPECTED_FACTORS.items()
}

# SafeSwim only grades the start date and the two days after it, and `score.txt`
# tells the scorer to omit `water` beyond that, so a later date missing it is
# right rather than incomplete.
WATER_QUALITY_DAYS = 3

# Highest band first in `CONDITION_BANDS`, so the index is severity ascending.
CONDITION_RANK = {condition: rank for rank, (_, condition) in enumerate(CONDITION_BANDS)}
CONDITION_RANK[UNSUITABLE] = len(CONDITION_BANDS)

# Snorkelling's temperature is pinned to `acceptable` by instruction and told
# never to decide the overall score, so it cannot be the worst factor either.
BAND_EXEMPT = {("snorkelling", "temp")}

# The generic labels `score.txt` names as bad, lowercased for comparison.
BANNED_SUMMARIES = frozenset({
    "unsuitable conditions", "marginal conditions", "acceptable conditions",
    "ideal conditions", "good conditions", "poor conditions", "n/a", "no data",
})

# `analysis` is asked for as two or three short paragraphs.
ANALYSIS_PARAGRAPHS = (2, 3)

_SENTENCE_END = re.compile(r"(?<=[.!?])\s")


def _activity(inputs, outputs):
    """Name the activity being scored, from wherever the runner put it."""
    return (outputs.get("_meta") or {}).get("activity") or inputs.get("activity")


def _forecast(outputs):
    return (outputs or {}).get("forecast") or {}


def _scored(forecast):
    """Keep the entries that carry a score.

    An entry with none is legitimate — a window whose hours have already passed
    is asked for as nearly empty — so quality metrics that averaged over it would
    read as a failure of the scorer rather than a fact about the day.
    """
    return {key: entry for key, entry in forecast.items() if entry.get("score") is not None}


def _expected_count(inputs):
    return len(forecast_dates(inputs["date"])) * len(FORECAST_WINDOWS)


def entry_coverage(inputs, outputs):
    """Report how much of the asked-for forecast came back.

    Scorers stop early, one run answering with the first day of ten, so this is
    the headline: everything else is quality over whatever survived.
    """
    forecast = _forecast(outputs)
    expected = _expected_count(inputs)
    dates = forecast_dates(inputs["date"])

    present = {(entry["date"], entry["timeRange"]) for entry in forecast.values()}
    whole_days = sum(
        1 for date in dates
        if all((date, window) in present for window in FORECAST_WINDOWS)
    )

    return metrics(
        metric("entry_coverage", ratio(len(forecast), expected),
               f"{len(forecast)}/{expected} entries"),
        metric("scored_coverage", ratio(len(_scored(forecast)), expected)),
        metric("date_coverage", ratio(whole_days, len(dates)),
               f"{whole_days}/{len(dates)} dates carry all four windows"),
    )


def problem_count(outputs):
    """Count the entries the parser had to drop, and name the first few.

    Two metrics because they are read differently. `parse_clean` points the way
    every other boolean here does, so a threshold table can hold it without one
    entry running backwards; `parse_problems` is the unbounded count, which is
    what you actually read when the boolean is False.
    """
    problems = (outputs or {}).get("problems") or []
    return metrics(
        metric("parse_clean", not problems, "; ".join(problems[:3]) or None),
        metric("parse_problems", len(problems)),
    )


def factor_completeness(inputs, outputs):
    """Report how many of the factors an activity should carry actually arrived.

    `water` is only expected for the days SafeSwim grades, so a later date
    omitting it counts as complete rather than as a gap.
    """
    activity = _activity(inputs, outputs)
    expected = EXPECTED_FACTORS.get(activity, COMMON_FACTORS)
    graded = set(forecast_dates(inputs["date"])[:WATER_QUALITY_DAYS])

    wanted = found = 0
    missing = set()
    for entry in _scored(_forecast(outputs)).values():
        for factor in expected:
            if factor == "water" and entry["date"] not in graded:
                continue
            wanted += 1
            if entry.get(factor):
                found += 1
            else:
                missing.add(factor)

    return metric(
        "factor_completeness", ratio(found, wanted),
        f"missing {', '.join(sorted(missing))}" if missing else None,
    )


def null_discipline(inputs, outputs):
    """Report how many entries stayed clear of the factors their activity cannot use.

    Cycling carrying a tide, or a water activity carrying humidity, is the mistake
    `score.txt` warns about most and the parser cannot catch — a tide percentage
    on a cycling entry is perfectly well-formed.
    """
    activity = _activity(inputs, outputs)
    forbidden = FORBIDDEN_FACTORS.get(activity, frozenset())

    entries = _scored(_forecast(outputs))
    offenders = {
        factor
        for entry in entries.values()
        for factor in forbidden
        if entry.get(factor)
    }
    clean = sum(
        1 for entry in entries.values()
        if not any(entry.get(factor) for factor in forbidden)
    )

    return metric(
        "null_discipline", ratio(clean, len(entries)),
        f"{activity} wrote {', '.join(sorted(offenders))}" if offenders else None,
    )


def worst_condition(entry, activity):
    """Name the worst condition among the factors allowed to decide the score."""
    conditions = [
        values["condition"]
        for factor, values in entry.items()
        if factor in FACTOR_FIELDS
        and values
        and values.get("condition") in CONDITION_RANK
        and (activity, factor) not in BAND_EXEMPT
    ]
    return max(conditions, key=CONDITION_RANK.__getitem__) if conditions else None


def band_consistency(inputs, outputs):
    """Report how often the entry's score lands in the band its worst factor sets.

    `score.txt` states the rule outright, which makes it purely mechanical to
    check — and it is the failure the parser already had to work around, having
    seen sub-40 scores labelled `marginal` on 6 of 160 entries.
    """
    activity = _activity(inputs, outputs)

    checked = agreed = 0
    examples = []
    for key, entry in _scored(_forecast(outputs)).items():
        worst = worst_condition(entry, activity)
        if worst is None:
            continue
        checked += 1
        actual = condition_for(entry["score"])
        if actual == worst:
            agreed += 1
        elif len(examples) < 3:
            examples.append(f"{key} scored {entry['score']} ({actual}) worst {worst}")

    return metric("band_consistency", ratio(agreed, checked), "; ".join(examples) or None)


def hourly_coverage(outputs):
    """Report how many of each window's hourly slots arrived.

    The windows are sliced out of one array by the parser, so they cannot
    structurally disagree with the day — what can still go missing is the array
    being short, which is legitimate only on a first day whose hours have passed.
    """
    covered = wanted = 0
    for entry in _scored(_forecast(outputs)).values():
        first, last = WINDOW_HOURS[entry["timeRange"]]
        wanted += last - first + 1
        covered += min(len(entry.get("hourly") or []), last - first + 1)

    return metric("hourly_coverage", ratio(covered, wanted))


def hourly_entry_agreement(outputs, tolerance=5):
    """Report how often an entry's score sits inside its own hourly range.

    A scorer can write an all-day 85 over hourly scores in the thirties without
    breaking any structural rule, and the entry is what the ranking uses.
    """
    inside = checked = 0
    examples = []
    for key, entry in _scored(_forecast(outputs)).items():
        slots = [slot["score"] for slot in entry.get("hourly") or []]
        if not slots:
            continue
        checked += 1
        low, high = min(slots) - tolerance, max(slots) + tolerance
        if low <= entry["score"] <= high:
            inside += 1
        elif len(examples) < 3:
            examples.append(f"{key} scored {entry['score']} over hours {min(slots)}-{max(slots)}")

    return metric("hourly_entry_agreement", ratio(inside, checked),
                  "; ".join(examples) or None)


def _opening_repeats_summary(summary, analysis):
    """Check whether the analysis's first sentence just repeats the summary."""
    opening = _SENTENCE_END.split(analysis.strip(), 1)[0]
    words, other = set(summary.lower().split()), set(opening.lower().split())
    if not words or not other:
        return False
    return len(words & other) / len(words | other) > 0.6


def summary_discipline(outputs):
    """Report the parts of the prose contract that can be counted.

    Whether the analysis names the factor that actually decided the score is left
    to a judge; whether it exists, runs to two or three paragraphs and avoids
    opening on the summary verbatim does not need one.
    """
    entries = _scored(_forecast(outputs))
    written = paragraphs = distinct = specific = 0

    for entry in entries.values():
        summary = (entry.get("summary") or "").strip()
        analysis = (entry.get("analysis") or "").strip()
        if summary and analysis:
            written += 1
        if summary.lower().rstrip(".") not in BANNED_SUMMARIES:
            specific += 1
        count = len([part for part in analysis.split("\n\n") if part.strip()])
        if ANALYSIS_PARAGRAPHS[0] <= count <= ANALYSIS_PARAGRAPHS[1]:
            paragraphs += 1
        if summary and analysis and not _opening_repeats_summary(summary, analysis):
            distinct += 1

    total = len(entries)
    return metrics(
        metric("prose_present", ratio(written, total)),
        metric("summary_specific", ratio(specific, total)),
        metric("analysis_paragraphs", ratio(paragraphs, total)),
        metric("analysis_distinct", ratio(distinct, total)),
    )


def window_coherence(outputs, tolerance=5):
    """Report how often an all-day score sits within its own sub-windows' range.

    The three sub-windows partition all-day exactly, so a day scored higher than
    every part of it is a contradiction the scorer produced on its own.
    """
    by_date = {}
    for entry in _scored(_forecast(outputs)).values():
        by_date.setdefault(entry["date"], {})[entry["timeRange"]] = entry["score"]

    checked = agreed = 0
    for windows in by_date.values():
        parts = [
            score for window, score in windows.items()
            if window != ALL_DAY and score is not None
        ]
        if ALL_DAY not in windows or not parts:
            continue
        checked += 1
        if min(parts) - tolerance <= windows[ALL_DAY] <= max(parts) + tolerance:
            agreed += 1

    return metric("window_coherence", ratio(agreed, checked))


def sources_were_given(inputs, outputs):
    """Report whether the example actually carried the sources the activity uses.

    A frozen seed missing a source is a fault in the dataset, not the scorer, and
    it would otherwise show up as poor factor completeness and be blamed on the
    model.
    """
    # Imported here rather than at module scope: `score_nodes` reaches through to
    # `score_agent`, which builds the scoring model at import time and wants an
    # API key while doing so. Importing an evaluator must not need credentials.
    from langraph.nodes.score_nodes import ACTIVITY_SOURCES

    activity = _activity(inputs, outputs)
    wanted = ACTIVITY_SOURCES.get(activity, ())
    given = [source for source in wanted if inputs.get(source)]
    missing = sorted(set(wanted) - set(given))
    return metric("seed_sources_given", ratio(len(given), len(wanted)),
                  f"seed is missing {', '.join(missing)}" if missing else None)
