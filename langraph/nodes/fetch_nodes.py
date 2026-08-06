import os

from langraph.agents.fetch_agent import run_fetch_agent
from langraph.prompts.loader import load_prompt
from langraph.sources.water_quality import fetch_water_quality_rows
from langraph.sources.weather import fetch_weather_rows


def fetch_water_quality(state):
    """Fetch water quality from SafeSwim.

    Fetched without an agent: choosing the nearest beach is a nearest-neighbour
    search over 315 entries, and the grade array has no timestamps for a model to
    reason about — it begins at the next whole hour, which the agent used to
    guess wrongly, inventing the hours already gone.
    """
    return {
        "water_quality": fetch_water_quality_rows(
            state["latitude"],
            state["longitude"],
            state["timezone"],
        )
    }


def fetch_tides(state):
    """Fetch tide turning times from NIWA API."""
    prompt = load_prompt(
        "fetch_tides",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"tides": run_fetch_agent(prompt)}


def fetch_weather(state):
    """Fetch weather data from the Google Weather API.

    The only source fetched without an agent: its ten pages are sequential and
    its schema is fixed, which a ReAct loop handled neither cheaply nor correctly.
    """
    return {
        "weather": fetch_weather_rows(
            state["latitude"],
            state["longitude"],
            state["timezone"],
            os.environ.get("GOOGLE_WEATHER_API_KEY", ""),
        )
    }


def fetch_marine(state):
    """Fetch sea surface temperature and swell from Open-Meteo."""
    prompt = load_prompt(
        "fetch_marine",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"marine": run_fetch_agent(prompt)}


def fetch_sun_times(state):
    """Fetch sunrise/sunset times from sunrise-sunset.org."""
    prompt = load_prompt(
        "fetch_sun_times",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
        timezone=state["timezone"],
    )
    return {"sun_times": run_fetch_agent(prompt)}
