from langraph.agents.score_agent import run_score_agent
from langraph.prompts.loader import load_prompt


def _build_fetched_data(state):
    """Combine all fetched data into a single string for the scoring prompt."""
    sections = []
    if state.get("water_quality"):
        sections.append(f"### Water Quality\n```json\n{state['water_quality']}\n```")
    if state.get("tides"):
        sections.append(f"### Tides\n```json\n{state['tides']}\n```")
    if state.get("swell"):
        sections.append(f"### Swell\n```json\n{state['swell']}\n```")
    if state.get("weather"):
        sections.append(f"### Weather\n```json\n{state['weather']}\n```")
    if state.get("sea_temp"):
        sections.append(f"### Sea Surface Temperature\n```json\n{state['sea_temp']}\n```")
    if state.get("sun_times"):
        sections.append(f"### Sunrise/Sunset\n```json\n{state['sun_times']}\n```")
    return "\n\n".join(sections)


def _score_activity(state, activity):
    """Score a single activity using the fetched data."""
    file_path = f"{state['location_slug']}-{activity}.json"
    prompt = load_prompt(
        "score",
        latitude=state["latitude"],
        longitude=state["longitude"],
        activity=activity,
        date=state["date"],
        fetched_data=_build_fetched_data(state),
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
