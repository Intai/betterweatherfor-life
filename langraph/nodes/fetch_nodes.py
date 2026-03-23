import os

from langraph.agents.fetch_agent import run_fetch_agent
from langraph.prompts.loader import load_prompt


def fetch_water_quality(state):
    """Fetch water quality data from SafeSwim API."""
    prompt = load_prompt(
        "fetch_water_quality",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"water_quality": run_fetch_agent(prompt)}


def fetch_tides(state):
    """Fetch tide turning times from NIWA API."""
    prompt = load_prompt(
        "fetch_tides",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"tides": run_fetch_agent(prompt)}


def fetch_swell(state):
    """Fetch swell data from Windy.app."""
    prompt = load_prompt(
        "fetch_swell",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"swell": run_fetch_agent(prompt)}


def fetch_weather(state):
    """Fetch weather data from Google Weather API."""
    prompt = load_prompt(
        "fetch_weather",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
        google_weather_api_key=os.environ.get("GOOGLE_WEATHER_API_KEY", ""),
    )
    return {"weather": run_fetch_agent(prompt)}


def fetch_sea_temp(state):
    """Fetch sea surface temperature from Open-Meteo."""
    prompt = load_prompt(
        "fetch_sea_temp",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"sea_temp": run_fetch_agent(prompt)}


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
