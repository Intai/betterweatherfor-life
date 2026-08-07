import json
import os
from pathlib import Path
from typing import NamedTuple

from langraph.agents.score_agent import invoke_score, truncated_at, truncation_error
from langraph.prompts.loader import load_prompt
from langraph.utils.messages import extract_message_text
from langraph.utils.score_parser import (
    FORECAST_WINDOWS,
    forecast_dates,
    parse_forecast,
)

SECTIONS = (
    ("water_quality", "Water Quality"),
    ("tides", "Tides"),
    ("weather", "Weather"),
    ("marine", "Sea Surface Temperature and Swell"),
    ("sun_times", "Sunrise/Sunset"),
)

WATER_SOURCES = ("water_quality", "tides", "weather", "marine", "sun_times")

# Cycling nulls out tide, water quality, sea temperature and visibility in the scored
# output, so passing those sources would only inflate the prompt it re-sends each turn.
ACTIVITY_SOURCES = {
    "sup": WATER_SOURCES,
    "kayaking": WATER_SOURCES,
    "snorkelling": WATER_SOURCES,
    "cycling": ("weather", "sun_times"),
}


def _build_fetched_data(state, activity):
    """Combine the fetched data an activity can actually use into a single string.

    Args:
        state: The forecast state holding each fetched source.
        activity: The activity being scored, keying into ACTIVITY_SOURCES.

    Returns:
        The markdown sections for that activity's sources, newline separated.
    """
    sources = ACTIVITY_SOURCES[activity]
    return "\n\n".join(
        f"### {title}\n```json\n{state[key]}\n```"
        for key, title in SECTIONS
        if key in sources and state.get(key)
    )


class ScoreAttempt(NamedTuple):
    """One scorer call and everything a caller might judge it by.

    Attributes:
        forecast: The entries as `parse_forecast` rebuilt them, possibly partial.
        problems: What each entry that did not parse got wrong.
        entry_count: How many entries the prompt asked for, so a caller can say
            what fraction came back without re-deriving the date range.
        response: The provider's reply, carrying its token counts.
        truncated: The stop reason if the provider cut the answer off at its
            token cap, otherwise None.
    """

    forecast: dict
    problems: list
    entry_count: int
    response: object
    truncated: str | None


def score_activity(state, activity, llm=None):
    """Score a single activity and read the answer back, writing nothing.

    A truncated or unscored answer is reported rather than raised, because that
    is a measurement to an evaluator and a failure only to the node below. An
    answer that is not JSON at all still raises, since there is nothing to weigh.

    Args:
        state: The forecast state holding each fetched source.
        activity: The activity being scored, keying into ACTIVITY_SOURCES.
        llm: A chat model to use instead of the module singleton, so one process
            can score against several models.

    Returns:
        A ScoreAttempt.

    Raises:
        ValueError: If the answer is not valid JSON or is malformed as a whole,
            leaving nothing to salvage.
    """
    dates = forecast_dates(state["date"])
    entry_count = len(dates) * len(FORECAST_WINDOWS)
    prompt = load_prompt(
        "score",
        latitude=state["latitude"],
        longitude=state["longitude"],
        activity=activity,
        date=dates[0],
        dates=", ".join(dates),
        entry_count=entry_count,
        fetched_data=_build_fetched_data(state, activity),
    )
    response = invoke_score(prompt, llm=llm)
    forecast, problems = parse_forecast(
        extract_message_text(response.content),
        dates,
        activity,
        state["latitude"],
        state["longitude"],
    )
    return ScoreAttempt(
        forecast, problems, entry_count, response, truncated_at(response)
    )


def _score_and_write(state, activity):
    """Score a single activity and write the result beside the other forecasts.

    The path stays relative to the working directory, which `db/update-forecasts.js`
    sets to the repo root before reading the files back. `FORECAST_OUTPUT_DIR`
    sends it somewhere else, which is what keeps an eval run from littering.
    """
    attempt = score_activity(state, activity)

    # A completion the provider stopped at the token cap and one the model chose
    # to end look identical downstream, so the finish reason is what tells them
    # apart — see `langraph/agents/score_agent.py`.
    if attempt.truncated:
        raise truncation_error(attempt.response)

    # A short answer is fine — `db/update-forecasts.js` upserts what it finds and
    # deletes nothing. An answer with no scores at all is not: it upserts nothing,
    # so the activity would quietly serve yesterday's forecast while the run
    # reported success.
    if not any(entry["score"] is not None for entry in attempt.forecast.values()):
        detail = f"; first problem: {attempt.problems[0]}" if attempt.problems else ""
        raise ValueError(
            f"Score response for `{activity}` has no scored entries out of "
            f"{attempt.entry_count} expected{detail}"
        )

    directory = Path(os.environ.get("FORECAST_OUTPUT_DIR", "."))
    file_path = directory / f"{state['location_slug']}-{activity}.json"
    file_path.write_text(json.dumps(attempt.forecast, indent=2))
    return attempt.forecast


def score_sup(state):
    """Score SUP activity."""
    return {"sup_forecast": _score_and_write(state, "sup")}


def score_kayaking(state):
    """Score kayaking activity."""
    return {"kayaking_forecast": _score_and_write(state, "kayaking")}


def score_snorkelling(state):
    """Score snorkelling activity."""
    return {"snorkelling_forecast": _score_and_write(state, "snorkelling")}


def score_cycling(state):
    """Score cycling activity."""
    return {"cycling_forecast": _score_and_write(state, "cycling")}
