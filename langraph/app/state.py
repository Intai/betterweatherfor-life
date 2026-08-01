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
    swell: NotRequired[str]
    weather: NotRequired[str]
    sea_temp: NotRequired[str]
    sun_times: NotRequired[str]
    sup_forecast: NotRequired[list]
    kayaking_forecast: NotRequired[list]
    snorkelling_forecast: NotRequired[list]
    cycling_forecast: NotRequired[list]
