import json
from contextlib import contextmanager
from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

import pytest

from langraph.sources.water_quality import (
    _distance,
    fetch_water_quality_rows,
    nearest_slug,
)

TIMEZONE = "Pacific/Auckland"
MISSION_BAY = ("-36.8547", "174.8317")


def beach(slug, latitude, longitude):
    return {"name": slug, "slug": slug, "position": [latitude, longitude]}


DIRECTORY = {
    "locations": [
        beach("houhora-heads", -34.823295, 173.148091),
        beach("mission-bay-beach", -36.84716, 174.8312),
        beach("kohimarama-beach", -36.8508, 174.8452),
    ]
}


@contextmanager
def api(*documents):
    """Serve canned JSON documents in order, capturing the URLs requested."""
    calls = []

    @contextmanager
    def urlopen(url):
        calls.append(url)

        class Response:
            def read(self):
                return json.dumps(documents[len(calls) - 1]).encode()

        yield Response()

    with patch("langraph.sources.water_quality.urllib.request.urlopen", urlopen):
        yield calls


@contextmanager
def now(local):
    """Freeze the clock so the grade array's start hour is predictable."""
    frozen = datetime.fromisoformat(local)

    class Clock(datetime):
        @classmethod
        def now(cls, tz=None):
            return frozen.replace(tzinfo=ZoneInfo(TIMEZONE)) if tz else frozen

    with patch("langraph.sources.water_quality.datetime", Clock):
        yield


def location(*grades):
    return {"forecasts": {"WATER_QUALITY": list(grades)}}


def test_distance_is_zero_at_the_same_point():
    assert _distance(-36.8547, 174.8317, -36.8547, 174.8317) == 0


def test_distance_grows_with_separation():
    close = _distance(-36.8547, 174.8317, -36.84716, 174.8312)
    far = _distance(-36.8547, 174.8317, -34.823295, 173.148091)
    assert close < 2 < far


def test_nearest_slug_picks_the_closest_beach():
    with api(DIRECTORY):
        assert nearest_slug(*MISSION_BAY) == "mission-bay-beach"


def test_nearest_slug_accepts_a_bare_list_directory():
    with api(DIRECTORY["locations"]):
        assert nearest_slug(*MISSION_BAY) == "mission-bay-beach"


@pytest.mark.parametrize("directory", [
    {"locations": []},
    {"locations": [{"name": "No position", "slug": "no-position"}]},
    {"locations": [{"name": "No slug", "position": [-36.8, 174.8]}]},
    {"locations": [{"slug": "ragged", "position": [-36.8]}]},
])
def test_nearest_slug_rejects_a_directory_with_nothing_placed(directory):
    with api(directory), pytest.raises(ValueError, match="no located beaches"):
        nearest_slug(*MISSION_BAY)


def test_fetch_water_quality_rows_starts_at_the_next_whole_hour():
    # The array carries no timestamps, and reading it as whole days once invented
    # nine hours of grades the API had never returned.
    with now("2026-08-05T15:20"), api(DIRECTORY, location("GREEN", "ORANGE", "RED")):
        rows = json.loads(fetch_water_quality_rows(*MISSION_BAY, TIMEZONE))["rows"]

    assert rows == [
        ["2026-08-05T16:00", "Green"],
        ["2026-08-05T17:00", "Orange"],
        ["2026-08-05T18:00", "Red"],
    ]


def test_fetch_water_quality_rows_requests_the_nearest_beach():
    with now("2026-08-05T15:20"), api(DIRECTORY, location("GREEN")) as calls:
        fetch_water_quality_rows(*MISSION_BAY, TIMEZONE)

    assert calls[1].endswith("/mission-bay-beach")


def test_fetch_water_quality_rows_keeps_only_daytime_hours():
    with now("2026-08-05T21:30"), api(DIRECTORY, location(*["GREEN"] * 12)):
        rows = json.loads(fetch_water_quality_rows(*MISSION_BAY, TIMEZONE))["rows"]

    # 22:00, then the overnight hours are skipped until 06:00 the next morning.
    assert [row[0] for row in rows] == [
        "2026-08-05T22:00",
        "2026-08-06T06:00",
        "2026-08-06T07:00",
        "2026-08-06T08:00",
        "2026-08-06T09:00",
    ]


def test_fetch_water_quality_rows_drops_ungraded_hours():
    # GREY means the forecast has run out, not that the water is any particular way.
    with now("2026-08-05T09:20"), api(DIRECTORY, location("GREEN", "GREY", "BLACK")):
        rows = json.loads(fetch_water_quality_rows(*MISSION_BAY, TIMEZONE))["rows"]

    assert rows == [["2026-08-05T10:00", "Green"], ["2026-08-05T12:00", "Black"]]


def test_fetch_water_quality_rows_survives_a_location_without_forecasts():
    with now("2026-08-05T09:20"), api(DIRECTORY, {"name": "Mission Bay Beach"}):
        assert json.loads(fetch_water_quality_rows(*MISSION_BAY, TIMEZONE))["rows"] == []
