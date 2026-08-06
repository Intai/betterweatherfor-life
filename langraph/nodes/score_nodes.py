import json
from pathlib import Path

from langraph.agents.score_agent import run_score
from langraph.prompts.loader import load_prompt
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


def _score_activity(state, activity):
    """Score a single activity and write the result beside the other forecasts.

    The path stays relative to the working directory, which `db/update-forecasts.js`
    sets to the repo root before reading the files back.
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
    forecast, problems = parse_forecast(
        run_score(prompt),
        dates,
        activity,
        state["latitude"],
        state["longitude"],
    )

    # A short answer is fine — `db/update-forecasts.js` upserts what it finds and
    # deletes nothing. An answer with no scores at all is not: it upserts nothing,
    # so the activity would quietly serve yesterday's forecast while the run
    # reported success.
    if not any(entry["score"] is not None for entry in forecast.values()):
        detail = f"; first problem: {problems[0]}" if problems else ""
        raise ValueError(
            f"Score response for `{activity}` has no scored entries out of "
            f"{entry_count} expected{detail}"
        )

    file_path = f"{state['location_slug']}-{activity}.json"
    Path(file_path).write_text(json.dumps(forecast, indent=2))
    return forecast


def score_sup(state):
    """Score SUP activity."""
    return {"sup_forecast": _score_activity(state, "sup")}


def score_kayaking(state):
    """Score kayaking activity."""
    return {"kayaking_forecast": _score_activity(state, "kayaking")}


def score_snorkelling(state):
    """Score snorkelling activity."""
    return {"snorkelling_forecast": _score_activity(state, "snorkelling")}


def score_cycling(state):
    """Score cycling activity."""
    return {"cycling_forecast": _score_activity(state, "cycling")}
