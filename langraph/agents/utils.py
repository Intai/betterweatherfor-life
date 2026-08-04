import json


def extract_fetch_text(content):
    """Extract plain text from a fetch agent's message content (string or content blocks)."""
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
