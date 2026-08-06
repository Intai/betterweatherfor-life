"""The shape of a scored forecast, and the reading of a scorer's answer into it.

Scorers answer sparsely and get things wrong in ways that repeat, so most of the
constants below exist to name what an answer may contain and most of the helpers
exist to coerce or reject one particular mistake. The comments record which.
"""

import json
import re
from datetime import date as date_type
from datetime import timedelta

from langraph.utils.messages import unfence

# The score prompt asks for the start date plus the next 9 days, one entry per
# window. Scorers have silently answered with a fraction of that, so the count is
# checked rather than trusted.
FORECAST_DAYS = 10
ALL_DAY = "all-day"

# The hours each window covers, inclusive, matching the 06:00-22:00 range every
# fetch source trims to. The three sub-windows partition all-day exactly, so
# slicing them from one array cannot disagree with it — which the scorer's own
# arrays did on 40 of 40 days.
WINDOW_HOURS = {
    ALL_DAY: (6, 22),
    "morning": (6, 11),
    "afternoon": (12, 17),
    "evening": (18, 22),
}

# Derived so a window cannot be added to one and forgotten in the other. Dicts
# keep insertion order, so all-day stays first.
FORECAST_WINDOWS = tuple(WINDOW_HOURS)

# Score bands, highest first. Deriving the condition rather than letting the
# scorer restate it removed a contradiction it produced on 6 of 160 entries and
# 41 of 1,186 hourly slots, every one a sub-40 score labelled `marginal`.
CONDITION_BANDS = ((80, "ideal"), (60, "acceptable"), (40, "marginal"))
UNSUITABLE = "unsuitable"

# Derived from the bands, so renaming one cannot leave `_VALIDATORS` rejecting a
# condition the scorer was asked for.
CONDITIONS = frozenset({condition for _, condition in CONDITION_BANDS} | {UNSUITABLE})
TIDE_STATES = frozenset({"Rising", "Falling"})

# Every field a factor may carry, in the order the stored entry lays them out.
# `daylight` carries two distinct times, not two names for one: the water
# activities stop at sunset, cycling rides on to civil twilight. Either or both
# may arrive, and each is kept under the name the scorer wrote.
FACTOR_FIELDS = {
    "wind": ("speed", "gust", "direction", "condition", "summary"),
    "precipitation": ("amount", "chance", "condition", "summary"),
    "tide": ("state", "percentage", "nextHigh", "nextLow", "swell", "condition", "summary"),
    "water": ("quality", "condition", "summary"),
    "temp": ("air", "feelsLike", "water", "condition", "summary"),
    "daylight": ("sunset", "civilTwilightEnd", "condition", "summary"),
    "uv": ("index", "condition", "summary"),
    "humidity": ("percentage", "condition", "summary"),
    "visibility": ("estimate", "condition", "summary"),
}

# The fields an entry carries in its own right rather than under a factor.
_ENTRY_FIELDS = ("score", "summary", "analysis")

# Scorers answer sparsely: a factor the activity cannot use, or a field with no
# value, is left out rather than written as null. That is what keeps the answer
# small, and it is also why nothing here has to be counted — every value arrives
# named. Two columnar formats were tried first and both foundered on counting:
# row-major lost track of runs of nulls and padded rows two values wide, then
# column-major miscounted array lengths at 40 entries and failed 4 calls in 7.
HOURLY_FROM = "from"
HOURLY_SCORES = "scores"


def forecast_dates(start_date):
    """List the ISO dates a forecast covers, starting from `start_date`."""
    start = date_type.fromisoformat(start_date)
    return [str(start + timedelta(days=day)) for day in range(FORECAST_DAYS)]


def condition_for(score):
    """Map a score onto its condition band, or None when there is no score."""
    if score is None:
        return None
    for threshold, condition in CONDITION_BANDS:
        if score >= threshold:
            return condition
    return UNSUITABLE


def _is_int(value):
    """Check for a real integer — `bool` is an `int` subclass and must not pass."""
    return isinstance(value, int) and not isinstance(value, bool)


def _is_percentage(value):
    return _is_int(value) and 0 <= value <= 100


_TIME = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")

def _is_time(value):
    return isinstance(value, str) and _TIME.match(value) is not None


def _is_scores(value):
    return isinstance(value, list) and all(_is_percentage(score) for score in value)


# Fields whose value must be an integer, named `factor.field` or, for the entry
# itself, by name alone.
_INTEGER_FIELDS = frozenset({("uv", "index"), ("tide", "percentage")})

# Every value arrives named, so these check that a field holds the right sort of
# thing rather than that nothing has slipped out of position.
_VALIDATORS = {
    "score": _is_percentage,
    "uv.index": _is_int,
    "tide.percentage": _is_percentage,
    "tide.state": TIDE_STATES.__contains__,
    "tide.nextHigh": _is_time,
    "tide.nextLow": _is_time,
    "daylight.sunset": _is_time,
    "daylight.civilTwilightEnd": _is_time,
    **{f"{factor}.condition": CONDITIONS.__contains__ for factor in FACTOR_FIELDS},
}


def _read_response(content):
    """Parse the response into its `entries` object and per-date hourly scores."""
    try:
        data = json.loads(unfence(content))
    except (TypeError, AttributeError, json.JSONDecodeError) as error:
        raise ValueError(f"Score response is not valid JSON: {error}") from error

    entries = data.get("entries") if isinstance(data, dict) else None
    hourly = data.get("hourly") if isinstance(data, dict) else None

    if not isinstance(entries, dict) or not entries:
        raise ValueError("Score response needs a non-empty `entries` object")
    if not isinstance(hourly, dict) or not hourly:
        raise ValueError("Score response needs a non-empty `hourly` object keyed by date")

    return entries, hourly


def _read_hourly(hourly, date):
    """Validate one date's hourly block and return its start hour and scores."""
    if date not in hourly:
        raise ValueError(f"Score response has no hourly scores for {date}")

    day = hourly[date]
    if not isinstance(day, dict) or not day:
        raise ValueError(f"Hourly scores for {date} need to be a non-empty object")

    start = day.get(HOURLY_FROM)
    scores = day.get(HOURLY_SCORES)
    if isinstance(scores, list):
        scores = [_coerce_int(_coerce_null(score)) for score in scores]

    if not _is_time(start):
        raise ValueError(f"Hourly scores for {date} have an invalid `from`: {start!r}")
    if not _is_scores(scores):
        raise ValueError(f"Hourly scores for {date} are not a list of scores")

    return start, scores


def _coerce_null(value):
    """Read a quoted `"null"` as a real null.

    Scorers write it into fields their activity cannot use — one answer put it
    in a tide percentage on a cycling entry, another in a humidity condition.
    """
    if isinstance(value, str) and value.strip().lower() == "null":
        return None
    return value


def _coerce_int(value):
    """Accept an integer written as a string, which scorers do now and then.

    Quoting a number is a harmless formatting choice — a summary or a `HH:MM`
    time still will not coerce, so the checks below keep their teeth.
    """
    if isinstance(value, str) and value.strip().lstrip("-").isdigit():
        return int(value)
    return value


def _field(record, path):
    """Read `score` or `factor.field` out of a part-built entry."""
    if "." not in path:
        return record.get(path)
    factor, field = path.split(".")
    values = record.get(factor)
    return values.get(field) if values else None


def _split_entry_key(key, dates):
    """Split `date;timeRange` and check both halves belong to this batch."""
    parts = key.split(";")
    if len(parts) != 2:
        raise ValueError(f"Entry key `{key}` needs to be `date;timeRange`")

    date, window = parts
    if date not in dates:
        raise ValueError(f"Entry `{key}` is for an unexpected date {date!r}")
    if window not in FORECAST_WINDOWS:
        raise ValueError(f"Entry `{key}` has an unknown timeRange {window!r}")

    return date, window


def _read_entry(key, data, problems):
    """Check one scored entry's shape, coercing the values scorers mis-write."""
    # An empty entry is legitimate: a window whose hours have already passed has
    # nothing to report, and the prompt asks for `{}` rather than a wall of nulls.
    # ValueError specifically, because `_score_activity` catches it to re-ask —
    # a TypeError would escape that and kill the forecast.
    if not isinstance(data, dict):
        raise ValueError(f"Entry `{key}` needs to be an object")  # noqa: TRY004

    # An unrecognised field is noted and dropped rather than thrown, along with
    # the entry holding it. Refusing over a name once cost cycling all 40 of its
    # entries — the scorer wrote `humidity.pct` for `percentage`, having never
    # been shown the field in an example.
    unknown = sorted(set(data) - set(FACTOR_FIELDS) - set(_ENTRY_FIELDS))
    if unknown:
        problems.append(f"Entry `{key}` ignored unknown fields {unknown[:3]}")

    record = {field: _coerce_null(data.get(field)) for field in _ENTRY_FIELDS}
    record["score"] = _coerce_int(record["score"])

    for factor, allowed in FACTOR_FIELDS.items():
        values = data.get(factor)
        if values is None:
            record[factor] = None
            continue
        if not isinstance(values, dict):
            raise ValueError(  # noqa: TRY004
                f"Entry `{key}` needs `{factor}` to be an object"
            )
        stray = sorted(set(values) - set(allowed))
        if stray:
            problems.append(f"Entry `{key}` ignored unknown `{factor}` fields {stray[:3]}")
        record[factor] = {
            field: _coerce_int(_coerce_null(value))
            if (factor, field) in _INTEGER_FIELDS
            else _coerce_null(value)
            for field, value in values.items()
            if field in allowed
        } or None

    for path, is_valid in _VALIDATORS.items():
        value = _field(record, path)
        if value is not None and not is_valid(value):
            raise ValueError(f"Entry `{key}` has an invalid `{path}`: {value!r}")

    return record


def _build_hourly(start, scores, window):
    """Slice a day's hourly scores down to one window.

    Every window is a slice of the same array, so the sub-windows cannot drift
    from the day they belong to — the scorer's own arrays managed to disagree
    with their all-day entry on 40 days out of 40.
    """
    first_hour = int(start[:2])
    first, last = WINDOW_HOURS[window]
    slots = []
    for offset, score in enumerate(scores):
        hour = first_hour + offset
        if first <= hour <= last:
            slots.append({
                "time": f"{hour:02d}:00",
                "score": score,
                "condition": condition_for(score),
            })

    return slots or None


def parse_forecast(content, dates, activity, latitude, longitude):
    """Read one batch of a scorer's answer and rebuild it into forecast entries.

    Scorers answer sparsely: `{"entries": {"<date>;<timeRange>": {...}}, "hourly":
    {...}}`, leaving out any factor or field their activity cannot use rather
    than writing it as null, and never repeating the activity or coordinates.

    Nothing here is positional — every value arrives named, so nothing has to be
    counted. The columnar shapes tried before this one both failed on exactly
    that counting; `HOURLY_FROM` above records how.

    The activity, coordinates, entry keys and both `condition` fields are rebuilt
    here rather than transcribed, so the scorer cannot contradict itself — it used
    to label sub-40 scores `marginal`, and once copied the prompt's illustrative
    coordinates into all 40 keys.

    Scorers also routinely stop early, one run answering with the first day of
    ten. Missing dates are left to the caller, which re-asks for them.

    Args:
        content: The scorer's message text.
        dates: The ISO dates a batch is allowed to answer with, as `YYYY-MM-DD`
            strings.
        activity: The activity being scored, used in the rebuilt keys.
        latitude: The location latitude as it appears in the entry keys.
        longitude: The location longitude as it appears in the entry keys.

    Returns:
        A `(forecast, problems)` pair. `forecast` holds every entry that parsed,
        possibly covering only some of `dates`. `problems` describes each entry
        that did not, so a caller that gives up can say why.

    Raises:
        ValueError: If the text is not valid JSON or the response as a whole is
            malformed, leaving nothing to salvage. A single bad entry is skipped
            and reported rather than raised.
    """
    entries, hourly = _read_response(content)

    # One malformed entry used to discard the other thirty-nine, so every round
    # re-asked for all ten dates with a byte-identical prompt and stood the same
    # chance of failing again. Keeping what parsed lets the caller re-ask for the
    # handful that did not.
    records, problems = {}, []
    for key, data in entries.items():
        try:
            date, window = _split_entry_key(key, dates)
            records[(date, window)] = _read_entry(key, data, problems)
        except ValueError as error:
            problems.append(str(error))

    day_hours = {}
    for date in {date for date, _ in records}:
        try:
            day_hours[date] = _read_hourly(hourly, date)
        except ValueError as error:
            problems.append(str(error))

    forecast = {}
    for (date, window), record in records.items():
        if date not in day_hours:
            # Without the day's scores the windows cannot be sliced, so leave the
            # entry missing and let the caller ask for that date again.
            continue
        entry = {
            "activity": activity,
            "date": date,
            "timeRange": window,
            "score": record["score"],
            "condition": condition_for(record["score"]),
        }
        for factor in FACTOR_FIELDS:
            entry[factor] = record[factor]
        entry["summary"] = record["summary"]
        entry["analysis"] = record["analysis"]
        entry["hourly"] = _build_hourly(*day_hours[date], window)
        forecast[f"{activity};{date};{window};{latitude},{longitude}"] = entry

    return forecast, problems
