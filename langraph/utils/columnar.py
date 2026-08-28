"""The columnar shape every fetch source answers in, and its validation."""

import json

# An excerpt is enough to tell a prose apology from truncated JSON from a stray
# fence, and keeps a 30k-token answer out of the traceback.
EXCERPT_CHARS = 200


def _excerpt(content):
    """Render a rejected response for an error message, bounded in length."""
    text = content if isinstance(content, str) else repr(content)
    if len(text) > EXCERPT_CHARS:
        return f"{text[:EXCERPT_CHARS]}... ({len(text)} chars)"
    return text


def compact_columnar(content):
    """Validate a columnar fetch response and re-serialise it without whitespace.

    Fetch sources answer with `{"fields": [...], "rows": [[...], ...]}` so that keys
    are not repeated per row. Every score prompt embeds this text verbatim, so a
    truncated or ragged response must fail here rather than reach the scorers.

    Args:
        content: The fetch source's response text.

    Returns:
        The same data serialised without whitespace.

    Raises:
        ValueError: If the text is empty, is not valid JSON, is missing `fields` or
            `rows`, or has a row whose length differs from `fields`. A model that
            answered nothing at all and one that answered badly are different
            faults with different fixes, so they get different messages, and the
            rejected text is quoted back: `json` reports only where it gave up,
            which reads the same for an empty string as for a prose apology.
    """
    if content is None or not str(content).strip():
        raise ValueError("Fetch response was empty")

    try:
        data = json.loads(content)
    except (TypeError, json.JSONDecodeError) as error:
        raise ValueError(
            f"Fetch response is not valid JSON: {error} — got: {_excerpt(content)}"
        ) from error

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
