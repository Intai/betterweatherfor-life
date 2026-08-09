"""What a fetched source is checked for.

Two of the five sources can be checked for correctness: tide turning points and
solar times for a date and a coordinate are astronomy, so a captured answer stays
right and becomes a golden. Weather and marine are live forecasts and will never
match a capture, so they get shape, coverage and plausibility instead — which
still catches an agent inventing hours, repeating one, or dropping a tide turning
point.

A whole answer left in UTC is a narrower matter: only `solar_times_local` detects
it from the values alone, and only `golden_match` detects it for tides. The rest
of these checks pass a uniformly shifted answer without complaint, because
shifting everything preserves the ordering, spacing and ranges they look at.
"""

import json
from datetime import datetime
from itertools import pairwise

from langraph.evals.evaluators.common import metric, metrics, ratio
from langraph.sources.water_quality import FIELDS as WATER_QUALITY_FIELDS
from langraph.sources.weather import CARDINALS
from langraph.sources.weather import FIELDS as WEATHER_FIELDS
from langraph.utils.score_parser import forecast_dates

# The three agent-fetched schemas live only in their prompt `.txt` files, so these
# are a copy. `langraph/tests/test_eval_fetch.py` asserts each prompt still
# contains its field names, which is what keeps the copy honest.
EXPECTED_FIELDS = {
    "water_quality": list(WATER_QUALITY_FIELDS),
    "weather": list(WEATHER_FIELDS),
    "tides": ["time", "type", "heightM"],
    "marine": ["time", "tempWater", "tideSwell"],
    "sun_times": ["date", "sunrise", "sunset", "civilTwilightEnd"],
}

# Only these hours reach the scorers, matching `sources/weather.py`.
FIRST_HOUR, LAST_HOUR = 6, 22

# One row per daytime hour of every forecast day.
HOURLY_SOURCES = ("weather", "marine")

# SafeSwim grades from the next whole hour rather than from the forecast date, so
# its span is whatever the beach happens to publish — checked for shape, not reach.
UNSPANNED_SOURCES = ("water_quality",)

# Plausibility envelopes by column name. Generous on purpose: this catches a unit
# confusion or an invented value, not a mildly unusual day.
RANGES = {
    "tempAir": (-20, 50), "tempFeelsLike": (-20, 50), "tempWater": (0, 35),
    "uvIndex": (0, 15), "humidityPercentage": (0, 100),
    "precipitationChance": (0, 100), "precipitationAmount": (0, 100),
    "windSpeed": (0, 200), "windGust": (0, 200),
    "tideSwell": (0, 15), "heightM": (-1, 12),
}

# The 16-point compass `sources/weather.py:_abbreviate` can produce: the eight
# points CARDINALS names, plus each intercardinal joined to each of its own two
# primaries, so "NE" gives "NNE" and "ENE". Derived rather than listed because a
# hand-rolled list got four points wrong in both directions at once — it rejected
# ENE, ESE, WNW and WSW, which the source emits whenever the wind swings, and
# accepted NSE, NSW, SNE and SNW, which are not compass points at all.
COMPASS = frozenset(
    set(CARDINALS.values())
    | {primary + inter for inter in ("NE", "NW", "SE", "SW") for primary in inter}
)

TIDE_TYPES = frozenset({"High", "Low"})

# Consecutive turning points are half a tidal day apart, ~6h12m, and drift by up
# to an hour or so either side. Dropping one leaves a gap of two intervals, about
# 12h24m, so the threshold sits between the two rather than above both — at 13
# hours a single missing turning point would pass, which is the whole failure
# this looks for and nothing else would show.
MAX_TIDE_GAP_HOURS = 9

# A sanity envelope wide enough for any latitude this site covers, but narrow
# enough that an answer left in UTC falls outside it.
SUNRISE_HOURS = (3, 9)
SUNSET_HOURS = (16, 22)

# The columns `golden_match` compares within `config.GOLDEN_TOLERANCE_MINUTES`
# rather than for equality — that constant says how much drift is allowed, this
# one says where. They are times transcribed by an agent that may round a second
# differently between runs. Every other column has no rounding story, there being
# no near-miss for "High", so it has to be equal. Note `sun_times` carries a
# `date` column that is a key rather than a time, and is deliberately absent
# here: tolerating it is what once let every solar time be wrong unnoticed.
GOLDEN_TIME_COLUMNS = {
    "tides": ("time",),
    "sun_times": ("sunrise", "sunset", "civilTwilightEnd"),
}


def _rows(outputs, source):
    """Read a source's answer into `(fields, rows)`, or `(None, None)` if unreadable."""
    try:
        data = json.loads((outputs or {}).get(source) or "")
        return data["fields"], data["rows"]
    except (TypeError, KeyError, json.JSONDecodeError):
        return None, None


def _column(fields, rows, name):
    """Take one named column's values, or an empty list when it is absent."""
    if not fields or name not in fields:
        return []
    index = fields.index(name)
    return [row[index] for row in rows]


def _moment(value):
    """Read a full timestamp or a bare `HH:MM`, or None when it is neither.

    Tides stamp `2026-03-24T04:12`; sun times carry `07:14` against a `date`
    column of their own. Both have to be read the same way to be compared.
    """
    for text in (str(value), f"2000-01-01T{value}"):
        try:
            return datetime.fromisoformat(text)
        except (TypeError, ValueError):
            continue
    return None


def _hour(stamp):
    """Read the hour out of an ISO-ish timestamp, or None if it is not one."""
    moment = _moment(stamp)
    return moment.hour if moment else None


def columnar_contract(outputs, source):
    """Report whether the answer is columnar JSON carrying exactly the right fields."""
    fields, _ = _rows(outputs, source)
    expected = EXPECTED_FIELDS[source]
    return metrics(
        metric("columnar_parseable", fields is not None),
        metric("fields_exact", fields == expected,
               f"got {fields}" if fields is not None and fields != expected else None),
    )


def coverage(inputs, outputs, source):
    """Report how much of the requested range the source actually returned.

    Plus whether the rows are ordered and free of duplicates, which is how an
    agent's invented hours show up — it repeats one and skips another.
    """
    fields, rows = _rows(outputs, source)
    if fields is None:
        return metrics(metric("row_coverage", 0.0, "unreadable answer"))

    dates = forecast_dates(inputs["date"])
    stamps = [row[0] for row in rows]

    # Both halves earn their place: sorting alone would accept a repeated hour,
    # and a repeat is exactly how an agent's invented hours show up — it writes
    # one twice and skips another, leaving the row count right. Comparing the
    # strings is sound because every source stamps its first column with a
    # fixed-width ISO timestamp, which sorts chronologically.
    ordered = stamps == sorted(stamps) and len(set(stamps)) == len(stamps)

    if source in HOURLY_SOURCES:
        expected = len(dates) * (LAST_HOUR - FIRST_HOUR + 1)
    elif source == "sun_times":
        expected = len(dates)
    elif source == "tides":
        # Two highs and two lows a day, give or take one across a 10-day range.
        expected = len(dates) * 4
    else:
        expected = len(stamps)

    in_hours = [
        stamp for stamp in stamps
        if source not in HOURLY_SOURCES or (_hour(stamp) or 0) >= FIRST_HOUR
    ]
    return metrics(
        metric("row_coverage", min(ratio(len(stamps), expected) or 0, 1.0),
               f"{len(stamps)}/{expected} rows"),
        metric("rows_ordered", ordered),
        metric("rows_in_daytime", ratio(len(in_hours), len(stamps))
               if source not in UNSPANNED_SOURCES else None),
    )


def _plausibility(key, inside, checked, offenders):
    """Shape one plausibility metric, naming a few *distinct* offenders.

    Deduped and counted, because a systematically wrong column would otherwise
    print the same value three times and say nothing about how much of it failed.
    """
    distinct = list(dict.fromkeys(offenders))[:3]
    comment = f"{checked - inside}/{checked} — {', '.join(distinct)}" if distinct else None
    return metric(key, ratio(inside, checked), comment)


def _is_number(value):
    """Check for a real number — `bool` is an `int` subclass and must not pass."""
    return isinstance(value, int | float) and not isinstance(value, bool)


def value_ranges(outputs, source):
    """Report the share of values inside a plausible envelope for their column.

    Nulls pass: the marine model runs out before the end of the range and its
    final day is legitimately empty.
    """
    fields, rows = _rows(outputs, source)
    if fields is None:
        return metric("value_ranges", None, "unreadable answer")

    checked = inside = 0
    offenders = []
    for name in fields:
        if name not in RANGES:
            continue
        low, high = RANGES[name]
        for value in _column(fields, rows, name):
            if not _is_number(value):
                continue
            checked += 1
            if low <= value <= high:
                inside += 1
            else:
                offenders.append(f"{name}={value}")

    return _plausibility("value_ranges", inside, checked, offenders)


def wind_gusts_consistent(outputs):
    """Report the share of hours whose gust is at least the wind it gusts from.

    Weather only, since it is the one source carrying both columns. Kept apart
    from the envelope check because pooling them let a wholly broken column read
    as a tenth off: the envelope contributes eight comparisons an hour to this
    one's single one.
    """
    fields, rows = _rows(outputs, "weather")
    if fields is None:
        return metrics()

    checked = inside = 0
    offenders = []
    for gust, speed in zip(_column(fields, rows, "windGust"),
                           _column(fields, rows, "windSpeed"), strict=False):
        if not _is_number(gust) or not _is_number(speed):
            continue
        checked += 1
        if gust >= speed:
            inside += 1
        else:
            offenders.append(f"gust {gust} under speed {speed}")

    return metrics(
        _plausibility("wind_gusts_consistent", inside, checked, offenders)
    )


def wind_directions_known(outputs):
    """Report the share of hours naming a real compass point.

    Weather only. Nulls pass, as everywhere else — an hour with no direction is
    missing data, which `coverage` is what reports on.
    """
    fields, rows = _rows(outputs, "weather")
    if fields is None:
        return metrics()

    directions = [
        value for value in _column(fields, rows, "windDirection") if value is not None
    ]
    offenders = [f"{value!r}" for value in directions if value not in COMPASS]
    inside = len(directions) - len(offenders)

    return metrics(
        _plausibility("wind_directions_known", inside, len(directions), offenders)
    )


def solar_times_local(outputs):
    """Report whether sunrise and sunset look like local time rather than raw UTC.

    The failure `prompts/fetch_sun_times.txt` invites: an unconverted answer is
    perfectly well-formed, and only the hours themselves give it away.
    """
    fields, rows = _rows(outputs, "sun_times")
    if fields is None:
        return metrics()

    sunrises = [_hour(value) for value in _column(fields, rows, "sunrise")]
    sunsets = [_hour(value) for value in _column(fields, rows, "sunset")]
    plausible = sum(
        1 for rise, set_ in zip(sunrises, sunsets, strict=False)
        if rise is not None and set_ is not None
        and SUNRISE_HOURS[0] <= rise <= SUNRISE_HOURS[1]
        and SUNSET_HOURS[0] <= set_ <= SUNSET_HOURS[1]
    )
    return metrics(metric("solar_times_local", ratio(plausible, len(sunrises))))


def tide_series_plausible(outputs):
    """Report whether the turning points alternate and none has gone missing.

    Not a local-time check, despite sitting beside one: a series shifted wholesale
    into UTC still alternates High/Low and still has its ~6h gaps, so it passes
    both of these untouched. `golden_match` is what catches that for tides, having
    a committed reference to compare against. What this catches is a *dropped*
    turning point, which leaves two intervals back to back — see
    `MAX_TIDE_GAP_HOURS`.
    """
    fields, rows = _rows(outputs, "tides")
    if fields is None:
        return metrics()

    types = _column(fields, rows, "type")
    stamps = _column(fields, rows, "time")
    alternating = sum(
        1 for a, b in pairwise(types)
        if a in TIDE_TYPES and b in TIDE_TYPES and a != b
    )
    gaps = []
    for a, b in pairwise(stamps):
        try:
            gaps.append(datetime.fromisoformat(b) - datetime.fromisoformat(a))
        except (TypeError, ValueError):
            continue
    within = sum(1 for gap in gaps if gap.total_seconds() <= MAX_TIDE_GAP_HOURS * 3600)

    return metrics(
        metric("tides_alternate", ratio(alternating, max(len(types) - 1, 0))),
        metric("tide_gaps_plausible", ratio(within, len(gaps)),
               f"{len(gaps) - within} gaps over {MAX_TIDE_GAP_HOURS}h"
               if within < len(gaps) else None),
    )


def _golden_value_matches(name, actual, golden, source, tolerance_minutes):
    """Compare one column's value against the golden, by that column's own rule."""
    if name not in GOLDEN_TIME_COLUMNS.get(source, ()):
        return actual == golden

    drifted, reference = _moment(actual), _moment(golden)
    if drifted is None or reference is None:
        return False
    return abs(drifted - reference).total_seconds() <= tolerance_minutes * 60


def golden_match(outputs, reference_outputs, source, tolerance_minutes):
    """Match an answer against a committed capture, row by row and column by column.

    Only meaningful for the sources whose answers are astronomy rather than
    forecast, so `reference_outputs` is absent everywhere else and this reports
    nothing rather than a false pass.

    Every column is compared, not just the first — the first is `time` for tides
    but `date` for sun times, so checking it alone let every solar time be wrong
    while the metric read a perfect score. `GOLDEN_TIME_COLUMNS` names the ones a
    tolerance applies to; the rest have to be equal.

    Rows are paired by position, which `coverage` makes safe: it reports both
    whether the rows are ordered and whether the count is right, so a
    misalignment is already named by the metric that caused it.
    """
    reference = (reference_outputs or {}).get(source)
    if not reference:
        return metric("golden_match", None, "no golden for this source")

    fields, rows = _rows(outputs, source)
    expected_fields, expected_rows = _rows({source: reference}, source)
    if rows is None or expected_rows is None:
        return metric("golden_match", 0.0, "unreadable answer")
    if fields != expected_fields:
        return metric("golden_match", 0.0, f"fields differ: {fields}")

    matched = sum(
        1 for row, golden_row in zip(rows, expected_rows, strict=False)
        if all(
            _golden_value_matches(name, value, golden, source, tolerance_minutes)
            for name, value, golden in zip(fields, row, golden_row, strict=False)
        )
    )

    note = f"{matched}/{len(expected_rows)} rows within {tolerance_minutes} min"
    if len(rows) != len(expected_rows):
        # Otherwise a zero caused by one missing row reads as every value being
        # wrong, and `row_coverage` is where the real story is.
        note += f" — got {len(rows)} rows, not {len(expected_rows)}"

    return metric("golden_match", ratio(matched, len(expected_rows)), note)
