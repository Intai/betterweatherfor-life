import json
from datetime import date as date_type
from datetime import timedelta

# The score prompt asks for the start date plus the next 9 days, one entry per
# window. Scorers have silently answered with a fraction of that, so the count is
# checked rather than trusted.
FORECAST_DAYS = 10
FORECAST_WINDOWS = ("all-day", "morning", "afternoon", "evening")


def extract_message_text(content):
    """Extract plain text from an LLM message content (string or content blocks)."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, str):
                parts.append(block)
            elif isinstance(block, dict) and block.get("text"):
                parts.append(block["text"])
        return "\n".join(parts)
    return str(content)


def compact_columnar(content):
    """Validate a columnar fetch response and re-serialise it without whitespace.

    Fetch agents answer with `{"fields": [...], "rows": [[...], ...]}` so that keys
    are not repeated per row. Every score prompt embeds this text verbatim, so a
    truncated or ragged response must fail here rather than reach the scorers.

    Args:
        content: The fetch agent's final message text.

    Returns:
        The same data serialised without whitespace.

    Raises:
        ValueError: If the text is not valid JSON, is missing `fields` or `rows`,
            or has a row whose length differs from `fields`.
    """
    try:
        data = json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError(f"Fetch response is not valid JSON: {error}") from error

    fields = data.get("fields") if isinstance(data, dict) else None
    rows = data.get("rows") if isinstance(data, dict) else None

    if not isinstance(fields, list) or not fields:
        raise ValueError("Fetch response needs an object with a non-empty `fields` list")
    if not isinstance(rows, list) or any(not isinstance(row, list) for row in rows):
        raise ValueError("Fetch response needs `rows` to be a list of lists")

    for index, row in enumerate(rows):
        if len(row) != len(fields):
            raise ValueError(
                f"Row {index} has {len(row)} values, expected {len(fields)}"
            )

    return json.dumps(data, separators=(",", ":"))


def _expected_keys(activity, start_date, latitude, longitude):
    """Build the full set of entry keys a scored activity must cover."""
    start = date_type.fromisoformat(start_date)
    return {
        f"{activity};{start + timedelta(days=day)};{window};{latitude},{longitude}"
        for day in range(FORECAST_DAYS)
        for window in FORECAST_WINDOWS
    }


def parse_forecast(content, activity, start_date, latitude, longitude):
    """Validate a scored activity response and return it as a dict.

    Scorers answer with one entry per date and time window, keyed
    `activity;date;timeRange;latitude,longitude`. A short answer used to reach disk
    unnoticed — one run wrote 5 of the 40 entries and still reported success — and
    the ingest in `db/update-forecasts.js` skips entries without a score, so the
    gap stays invisible downstream. This fails here instead.

    Only the keys are checked, never the values: days beyond the weather range
    legitimately carry null factors, so a degraded fetch must still parse.

    Args:
        content: The scorer's message text.
        activity: The activity being scored, e.g. `sup`.
        start_date: The first forecast date as `YYYY-MM-DD`.
        latitude: The location latitude as it appears in the entry keys.
        longitude: The location longitude as it appears in the entry keys.

    Returns:
        The parsed forecast as a dict.

    Raises:
        ValueError: If the text is not valid JSON, is not an object, or does not
            cover exactly the expected dates and time windows.
    """
    try:
        data = json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError(f"Score response is not valid JSON: {error}") from error

    entries = data if isinstance(data, dict) else None
    if entries is None:
        raise ValueError("Score response needs to be an object of forecast entries")

    expected = _expected_keys(activity, start_date, latitude, longitude)
    missing = expected - entries.keys()
    unexpected = entries.keys() - expected

    if missing:
        raise ValueError(
            f"Score response has {len(entries)} entries, expected {len(expected)}; "
            f"missing {sorted(missing)[:3]}"
        )
    if unexpected:
        raise ValueError(f"Score response has unexpected entries {sorted(unexpected)[:3]}")

    return entries
