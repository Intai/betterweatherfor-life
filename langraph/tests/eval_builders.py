"""Builders the evaluator tests share, and nothing an evaluator imports.

Not a test module — pytest leaves it alone, and each `test_eval_*.py` takes the
subset of these it needs.

`columnar` takes its fields as an argument rather than reading `EXPECTED_FIELDS`,
so importing these builders never pulls in the fetch catalogue and, through it,
the SafeSwim and Google Weather HTTP modules. A score test has no business
loading either, which is the same separation `suites.py` exists to keep.
"""

import json

from langraph.utils.score_parser import FORECAST_WINDOWS, WINDOW_HOURS, forecast_dates

DATE = "2026-03-24"
INPUTS = {
    "latitude": "-36.8485", "longitude": "174.7633", "date": DATE,
    "timezone": "Pacific/Auckland", "location_slug": "mission-bay",
    "activity": "sup",
}


def find(result, key):
    """Take one metric out of a single- or multi-metric evaluator result."""
    entries = result["results"] if isinstance(result, dict) and "results" in result \
        else [result]
    for entry in entries:
        if entry["key"] == key:
            return entry
    raise AssertionError(f"no metric {key!r} in {[entry['key'] for entry in entries]}")


def hourly_for(window, score=80):
    """Build the hourly slots a window covers, as the parser slices them."""
    first, last = WINDOW_HOURS[window]
    return [
        {"time": f"{hour:02d}:00", "score": score, "condition": "ideal"}
        for hour in range(first, last + 1)
    ]


def entry(date=DATE, window="all-day", score=85, activity="sup", factors=None,
          summary="Light 8km/h NE breeze, easy paddling.",
          analysis="Mission Bay is calm today.\n\nWinds stay under 10km/h.",
          hourly=None):
    """Build one scored entry in the shape `parse_forecast` rebuilds."""
    built = {
        "activity": activity, "date": date, "timeRange": window,
        "score": score, "condition": "ideal",
        "wind": {"condition": "ideal", "summary": "Light."},
        "precipitation": {"condition": "ideal", "summary": "Dry."},
        "tide": {"condition": "ideal", "summary": "Rising."},
        "water": {"quality": "Green", "condition": "ideal", "summary": "Clean."},
        "temp": {"condition": "ideal", "summary": "Warm."},
        "daylight": {"sunset": "20:22", "condition": "ideal"},
        "uv": {"index": 4, "condition": "ideal", "summary": "Low."},
        "humidity": None,
        "visibility": None,
        "summary": summary,
        "analysis": analysis,
        "hourly": hourly if hourly is not None else hourly_for(window, score),
    }
    built.update(factors or {})
    return built


def forecast(days=10, activity="sup", **overrides):
    """Build a whole forecast, one entry per window per date."""
    return {
        f"{activity};{date};{window};-36.8485,174.7633":
            entry(date=date, window=window, activity=activity, **overrides)
        for date in forecast_dates(DATE)[:days]
        for window in FORECAST_WINDOWS
    }


def outputs_for(built, activity="sup", **meta):
    return {
        "forecast": built,
        "problems": [],
        "_meta": {"activity": activity, "entry_count": 40, **meta},
    }


def columnar(fields, rows):
    return json.dumps({"fields": fields, "rows": rows}, separators=(",", ":"))
