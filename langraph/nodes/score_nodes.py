from langraph.agents.score_agent import run_score_agent
from langraph.prompts.loader import load_prompt

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
    """Score a single activity using the fetched data."""
    file_path = f"{state['location_slug']}-{activity}.json"
    prompt = load_prompt(
        "score",
        latitude=state["latitude"],
        longitude=state["longitude"],
        activity=activity,
        date=state["date"],
        fetched_data=_build_fetched_data(state, activity),
        file_path=file_path,
    )
    return run_score_agent(prompt)


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
