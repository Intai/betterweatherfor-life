from typing import NotRequired

from typing_extensions import TypedDict


class ForecastState(TypedDict):
    latitude: str
    longitude: str
    date: str
    timezone: str
    location_slug: str
    water_quality: NotRequired[str]
    tides: NotRequired[str]
    weather: NotRequired[str]
    marine: NotRequired[str]
    sun_times: NotRequired[str]
    sup_forecast: NotRequired[dict]
    kayaking_forecast: NotRequired[dict]
    snorkelling_forecast: NotRequired[dict]
    cycling_forecast: NotRequired[dict]
