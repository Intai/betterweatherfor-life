"""Reading the text back out of an LLM reply, whatever wrapping it arrived in."""


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


def unfence(content):
    """Strip a markdown code fence from a response that was asked not to use one.

    Scorers wrap the JSON in a fence now and then regardless, and a 30k-token
    answer is far too expensive to discard over three backticks. The closing
    fence is optional so a response cut off at its token cap still reaches
    `json.loads`, which reports where it actually broke.
    """
    text = content.strip()
    if not text.startswith("```"):
        return text
    text = text[3:]
    if text[:4].lower() == "json":
        text = text[4:]
    if text.rstrip().endswith("```"):
        text = text.rstrip()[:-3]
    return text.strip()
