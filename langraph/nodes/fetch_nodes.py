import os

from langraph.agents.fetch_agent import run_fetch_agent
from langraph.prompts.loader import load_prompt
from langraph.sources.water_quality import fetch_water_quality_rows
from langraph.sources.weather import fetch_weather_rows


def fetch_water_quality(state, llm=None):
    """Fetch water quality from SafeSwim.

    Fetched without an agent: choosing the nearest beach is a nearest-neighbour
    search over 315 entries, and the grade array has no timestamps for a model to
    reason about — it begins at the next whole hour, which the agent used to
    guess wrongly, inventing the hours already gone.

    `llm` is accepted and ignored, so every entry in `FETCH_NODES` is callable
    the same way and `build_fetch_graph` needs no list of which take a model.
    """
    return {
        "water_quality": fetch_water_quality_rows(
            state["latitude"],
            state["longitude"],
            state["timezone"],
        )
    }


def fetch_tides(state, llm=None):
    """Fetch tide turning times from NIWA API.

    Args:
        state: The forecast state naming the location and date.
        llm: A chat model for the agent to use instead of the module singleton,
            so one process can compare several.
    """
    prompt = load_prompt(
        "fetch_tides",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
        timezone=state["timezone"],
    )
    return {"tides": run_fetch_agent(prompt, llm=llm)}


def fetch_weather(state, llm=None):
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


def fetch_marine(state, llm=None):
    """Fetch sea surface temperature and swell from Open-Meteo.

    Args:
        state: The forecast state naming the location and date.
        llm: A chat model for the agent to use instead of the module singleton.
    """
    prompt = load_prompt(
        "fetch_marine",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
    )
    return {"marine": run_fetch_agent(prompt, llm=llm)}


def fetch_sun_times(state, llm=None):
    """Fetch sunrise/sunset times from sunrise-sunset.org.

    Args:
        state: The forecast state naming the location and date.
        llm: A chat model for the agent to use instead of the module singleton.
    """
    prompt = load_prompt(
        "fetch_sun_times",
        latitude=state["latitude"],
        longitude=state["longitude"],
        date=state["date"],
        timezone=state["timezone"],
    )
    return {"sun_times": run_fetch_agent(prompt, llm=llm)}
