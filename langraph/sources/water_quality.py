"""SafeSwim water quality, fetched and reshaped without an LLM.

This was a fetch agent, and it was both the most expensive source and the only
one returning invented data. Picking the nearest beach meant handing the model
all 315 entries of the location directory — 49KB, ~15k input tokens — to choose
one slug, which is a nearest-neighbour search, not a judgement call.

Worse, `forecasts.WATER_QUALITY` is 72 bare strings with no timestamps anywhere
in the response, and the agent assumed they began at the start of the day. They
begin at the *next whole hour*: a run captured at 15:00 emitted rows from 06:00,
nine hours the API had never returned. Because the array sits on GREEN for days
at a time, the fabrication read as perfectly plausible.

The hour the array starts is pinned by the UV forecast alongside it, whose
non-zero span runs 09:00-17:00 against a 07:13 sunrise and 17:39 sunset, peaking
at local noon. Reading it as whole days puts that peak at 15:00 instead.
"""

import json
import math
import urllib.request
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from langraph.utils.columnar import compact_columnar

DIRECTORY = "https://safeswim.org.nz/api/locations"
LOCATION = "https://safeswim.org.nz/api/locations/{slug}"

# Only these hours reach the scorers; the time windows never look outside them.
FIRST_HOUR = 6
LAST_HOUR = 22

FIELDS = ["time", "waterQuality"]

# The API shouts its grades; the forecast schema uses title case. GREY means the
# forecast has run out rather than that the water is any particular way, so those
# hours are left out instead of being graded.
GRADES = {"GREEN": "Green", "ORANGE": "Orange", "RED": "Red", "BLACK": "Black"}

EARTH_RADIUS_KM = 6371


def _distance(latitude, longitude, other_latitude, other_longitude):
    """Great-circle distance in kilometres between two points."""
    first = math.radians(latitude)
    second = math.radians(other_latitude)
    delta_latitude = math.radians(other_latitude - latitude)
    delta_longitude = math.radians(other_longitude - longitude)
    haversine = (
        math.sin(delta_latitude / 2) ** 2
        + math.cos(first) * math.cos(second) * math.sin(delta_longitude / 2) ** 2
    )
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(haversine))


def _read(url):
    """Fetch and parse one JSON document."""
    with urllib.request.urlopen(url) as response:
        return json.loads(response.read())


def nearest_slug(latitude, longitude):
    """Find the slug of the SafeSwim location closest to a geolocation.

    Fetched live rather than kept as a snapshot: the directory is only 49KB, no
    part of it reaches a model, and a beach added or renamed upstream would
    otherwise resolve quietly to its neighbour.

    Args:
        latitude: The location latitude.
        longitude: The location longitude.

    Returns:
        The nearest location's slug.

    Raises:
        ValueError: If the directory holds no location with a position.
    """
    directory = _read(DIRECTORY)
    locations = directory.get("locations") if isinstance(directory, dict) else directory

    placed = [
        location for location in locations or []
        if isinstance(location.get("position"), list) and len(location["position"]) == 2
        and location.get("slug")
    ]
    if not placed:
        raise ValueError("SafeSwim directory has no located beaches")

    nearest = min(
        placed,
        key=lambda location: _distance(
            float(latitude), float(longitude), *location["position"]
        ),
    )
    return nearest["slug"]


def _graded_hours(grades, timezone):
    """Stamp the grade array with the hours it covers, keeping only daytime ones.

    The array starts at the next whole hour, so the hours already gone today are
    simply absent rather than guessed at.
    """
    zone = ZoneInfo(timezone)
    start = datetime.now(zone).replace(minute=0, second=0, microsecond=0)
    start += timedelta(hours=1)

    rows = []
    for offset, grade in enumerate(grades):
        hour = start + timedelta(hours=offset)
        if not FIRST_HOUR <= hour.hour <= LAST_HOUR:
            continue
        if grade not in GRADES:
            continue
        rows.append([hour.strftime("%Y-%m-%dT%H:%M"), GRADES[grade]])
    return rows


def fetch_water_quality_rows(latitude, longitude, timezone):
    """Fetch the nearest beach's water quality forecast as columnar rows.

    Args:
        latitude: The location latitude.
        longitude: The location longitude.
        timezone: IANA timezone of the location, e.g. `Pacific/Auckland`.

    Returns:
        `{"fields": [...], "rows": [[...], ...]}` serialised without whitespace,
        one row per graded daytime hour in local time.

    Raises:
        ValueError: If the directory holds no located beaches, or the assembled
            rows do not match the columnar contract.
    """
    location = _read(LOCATION.format(slug=nearest_slug(latitude, longitude)))
    grades = (location.get("forecasts") or {}).get("WATER_QUALITY") or []
    rows = _graded_hours(grades, timezone)
    return compact_columnar(json.dumps({"fields": FIELDS, "rows": rows}))
