"""Google Weather hourly forecast, fetched and reshaped without an LLM.

This was a fetch agent until it proved to be the wrong shape for the job. The
API caps `pageSize` at 24 hours, so ten days means ten *sequential* pages, and a
ReAct agent handled that badly in three separate ways: it fired pages in
parallel so the second went out without a token and 404ed, it stopped after two
pages when told to make ten calls, and it never converted the UTC timestamps
because the prompt asked for local hours without passing the timezone — every
row was labelled twelve hours early. Paging a fixed schema and renaming nine
fields needs none of a model's judgement, and cost ~246k tokens to get wrong.
"""

import json
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo

from langraph.utils.columnar import compact_columnar

ENDPOINT = "https://weather.googleapis.com/v1/forecast/hours:lookup"

FORECAST_HOURS = 240
# The API's ceiling: asking for pageSize=240 still returns 24 and a page token.
PAGE_SIZE = 24
# Enough pages for the full range, and a backstop against a token that never clears.
MAX_PAGES = 12

# Only these hours reach the scorers; the time windows never look outside them.
FIRST_HOUR = 6
LAST_HOUR = 22

# Trimming the response to the nine fields below takes a page from 49KB to 14KB.
FIELD_MASK = (
    "nextPageToken,forecastHours(interval.startTime,temperature.degrees,"
    "feelsLikeTemperature.degrees,uvIndex,"
    "precipitation(probability.percent,qpf.quantity),"
    "wind(direction.cardinal,speed.value,gust.value),relativeHumidity)"
)

# Named for the scored fields they feed rather than for their units, because a
# private shorthand is one more thing to translate and translation is where the
# scorer slips: shown `humPct` and never shown a humidity example, it wrote
# `humidity.pct` for `humidity.percentage` and lost cycling all 40 of its entries.
# The units live in the score prompt's granularity notes instead.
FIELDS = [
    "time", "tempAir", "tempFeelsLike", "uvIndex", "precipitationChance",
    "precipitationAmount", "windDirection", "windSpeed", "windGust",
    "humidityPercentage",
]

# The API spells directions out, the forecast schema abbreviates them. Compound
# points join their parts, so NORTH_NORTHEAST is N + NE.
CARDINALS = {
    "NORTH": "N", "SOUTH": "S", "EAST": "E", "WEST": "W",
    "NORTHEAST": "NE", "NORTHWEST": "NW", "SOUTHEAST": "SE", "SOUTHWEST": "SW",
}


def _abbreviate(cardinal):
    """Abbreviate a spelled-out wind direction, e.g. `NORTH_NORTHEAST` to `NNE`."""
    if not cardinal:
        return None
    parts = [CARDINALS.get(part) for part in cardinal.split("_")]
    return "".join(parts) if all(parts) else None


def _value(hour, *path):
    """Walk a nested path through an hour, yielding None if any step is absent."""
    current = hour
    for key in path:
        current = current.get(key) if isinstance(current, dict) else None
        if current is None:
            return None
    return current


def _pages(url):
    """Yield each page of the forecast, following `nextPageToken` until it clears."""
    token = None
    for _ in range(MAX_PAGES):
        page_url = f"{url}&pageToken={token}" if token else url
        with urllib.request.urlopen(page_url) as response:
            page = json.loads(response.read())
        yield page
        token = page.get("nextPageToken")
        if not token:
            return


def _local_hours(pages, timezone):
    """Flatten pages into hours stamped in local time, keeping only daytime ones."""
    zone = ZoneInfo(timezone)
    rows = []
    for page in pages:
        for hour in page.get("forecastHours") or []:
            start = _value(hour, "interval", "startTime")
            if not start:
                continue
            local = datetime.fromisoformat(start).astimezone(zone)
            if not FIRST_HOUR <= local.hour <= LAST_HOUR:
                continue
            rows.append([
                local.strftime("%Y-%m-%dT%H:%M"),
                _value(hour, "temperature", "degrees"),
                _value(hour, "feelsLikeTemperature", "degrees"),
                _value(hour, "uvIndex"),
                _value(hour, "precipitation", "probability", "percent"),
                _value(hour, "precipitation", "qpf", "quantity"),
                _abbreviate(_value(hour, "wind", "direction", "cardinal")),
                _value(hour, "wind", "speed", "value"),
                _value(hour, "wind", "gust", "value"),
                _value(hour, "relativeHumidity"),
            ])
    return rows


def fetch_weather_rows(latitude, longitude, timezone, api_key):
    """Fetch the 10-day hourly forecast as columnar rows.

    Args:
        latitude: The location latitude.
        longitude: The location longitude.
        timezone: IANA timezone of the location, e.g. `Pacific/Auckland`.
        api_key: Google Weather API key.

    Returns:
        `{"fields": [...], "rows": [[...], ...]}` serialised without whitespace,
        one row per daytime hour in local time.

    Raises:
        ValueError: If the assembled rows do not match the columnar contract.
    """
    query = urllib.parse.urlencode({
        "key": api_key,
        "location.latitude": latitude,
        "location.longitude": longitude,
        "hours": FORECAST_HOURS,
        "pageSize": PAGE_SIZE,
        "fields": FIELD_MASK,
    })
    rows = _local_hours(_pages(f"{ENDPOINT}?{query}"), timezone)
    return compact_columnar(json.dumps({"fields": FIELDS, "rows": rows}))
