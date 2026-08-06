import json
from contextlib import contextmanager
from unittest.mock import patch

import pytest

from langraph.sources.weather import (
    CARDINALS,
    MAX_PAGES,
    _abbreviate,
    fetch_weather_rows,
)

TIMEZONE = "Pacific/Auckland"


def hour(start_time, **overrides):
    """Build one forecastHours entry in the shape the field mask returns."""
    entry = {
        "interval": {"startTime": start_time},
        "temperature": {"degrees": 11.5},
        "feelsLikeTemperature": {"degrees": 9},
        "uvIndex": 3,
        "precipitation": {"probability": {"percent": 0}, "qpf": {"quantity": 0}},
        "wind": {"direction": {"cardinal": "SOUTH"}, "speed": {"value": 19},
                 "gust": {"value": 29}},
        "relativeHumidity": 56,
    }
    return {**entry, **overrides}


@contextmanager
def api(*pages):
    """Serve canned pages in order, capturing the URL each call was made with."""
    calls = []

    @contextmanager
    def urlopen(url):
        calls.append(url)

        class Response:
            def read(self):
                return json.dumps(pages[len(calls) - 1]).encode()

        yield Response()

    with patch("langraph.sources.weather.urllib.request.urlopen", urlopen):
        yield calls


def fetch():
    return json.loads(fetch_weather_rows("-36.8547", "174.8317", TIMEZONE, "k"))


def test_returns_the_columnar_contract():
    with api({"forecastHours": [hour("2026-08-05T18:00:00Z")]}):
        result = fetch()
    assert result["fields"] == [
        "time", "tempAir", "tempFeelsLike", "uvIndex", "precipitationChance",
        "precipitationAmount", "windDirection", "windSpeed", "windGust",
        "humidityPercentage",
    ]
    assert result["rows"] == [["2026-08-06T06:00", 11.5, 9, 3, 0, 0, "S", 19, 29, 56]]


def test_converts_utc_to_local_time():
    # The agent this replaced emitted the UTC clock as if it were local, putting
    # every row twelve hours early — 18:00Z is 06:00 the next day in Auckland.
    with api({"forecastHours": [hour("2026-08-05T18:00:00Z")]}):
        assert fetch()["rows"][0][0] == "2026-08-06T06:00"


def test_keeps_only_daytime_local_hours():
    with api({"forecastHours": [
        hour("2026-08-05T16:00:00Z"),  # 04:00 local, too early
        hour("2026-08-05T18:00:00Z"),  # 06:00 local, first kept
        hour("2026-08-06T10:00:00Z"),  # 22:00 local, last kept
        hour("2026-08-06T11:00:00Z"),  # 23:00 local, too late
    ]}):
        times = [row[0] for row in fetch()["rows"]]
    assert times == ["2026-08-06T06:00", "2026-08-06T22:00"]


def test_follows_the_page_token_until_it_clears():
    with api(
        {"forecastHours": [hour("2026-08-05T18:00:00Z")], "nextPageToken": "t1"},
        {"forecastHours": [hour("2026-08-05T19:00:00Z")], "nextPageToken": "t2"},
        {"forecastHours": [hour("2026-08-05T20:00:00Z")]},
    ) as calls:
        rows = fetch()["rows"]
    assert len(calls) == 3
    assert "pageToken" not in calls[0]
    assert calls[1].endswith("&pageToken=t1")
    assert calls[2].endswith("&pageToken=t2")
    assert [row[0] for row in rows] == [
        "2026-08-06T06:00", "2026-08-06T07:00", "2026-08-06T08:00",
    ]


def test_stops_at_the_page_cap_when_the_token_never_clears():
    page = {"forecastHours": [hour("2026-08-05T18:00:00Z")], "nextPageToken": "t"}
    with api(*[page] * (MAX_PAGES + 5)) as calls:
        fetch()
    assert len(calls) == MAX_PAGES


def test_sends_the_field_mask_and_page_size():
    with api({"forecastHours": []}) as calls:
        fetch()
    assert "pageSize=24" in calls[0]
    assert "hours=240" in calls[0]
    assert "relativeHumidity" in calls[0]


def test_tolerates_an_absent_nested_field():
    with api({"forecastHours": [hour("2026-08-05T18:00:00Z", wind={}, uvIndex=None)]}):
        row = fetch()["rows"][0]
    assert row[3] is None
    assert row[6:9] == [None, None, None]


def test_skips_an_hour_without_a_start_time():
    with api({"forecastHours": [{"temperature": {"degrees": 11.5}}]}):
        assert fetch()["rows"] == []


def test_handles_an_empty_response():
    with api({}):
        assert fetch()["rows"] == []


@pytest.mark.parametrize(("cardinal", "expected"), [
    ("NORTH", "N"), ("NORTH_NORTHEAST", "NNE"), ("NORTHEAST", "NE"),
    ("EAST_NORTHEAST", "ENE"), ("EAST", "E"), ("EAST_SOUTHEAST", "ESE"),
    ("SOUTHEAST", "SE"), ("SOUTH_SOUTHEAST", "SSE"), ("SOUTH", "S"),
    ("SOUTH_SOUTHWEST", "SSW"), ("SOUTHWEST", "SW"), ("WEST_SOUTHWEST", "WSW"),
    ("WEST", "W"), ("WEST_NORTHWEST", "WNW"), ("NORTHWEST", "NW"),
    ("NORTH_NORTHWEST", "NNW"),
])
def test_abbreviates_every_cardinal_the_api_returns(cardinal, expected):
    # All sixteen appeared across a real 240-hour forecast.
    assert _abbreviate(cardinal) == expected


@pytest.mark.parametrize("cardinal", [None, "", "SIDEWAYS", "NORTH_SIDEWAYS"])
def test_abbreviates_an_unknown_cardinal_to_none(cardinal):
    assert _abbreviate(cardinal) is None


def test_cardinals_cover_the_compass():
    assert len(CARDINALS) == 8
