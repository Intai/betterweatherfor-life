import subprocess

from langchain_core.tools import tool


@tool
def curl(
    url: str, method: str = "GET", headers: dict | None = None, data: str | None = None
) -> str:
    """Fetch data from a URL using curl.

    A failed request returns a `curl failed` report rather than raising, so the agent
    can read the status and body and stop rather than retry blindly. This used to be
    `-s -f`, which discards the body *and* the message on a non-2xx: NIWA rejecting an
    out-of-range longitude with a 422 reached the agent as an empty string, so it
    reported the API as returning nothing and the real reason never left the process.

    Args:
        url: The URL to fetch.
        method: HTTP method (GET, POST, PUT, DELETE).
        headers: Optional dict of HTTP headers (e.g. {"accept": "text/csv"}).
        data: Optional request body payload.

    Returns:
        The response body, or a `curl failed (exit N): ...` report naming the status
        and whatever body came with it.
    """
    args = ["curl", "-sS", "--fail-with-body", "-X", method]
    for key, value in (headers or {}).items():
        args.extend(["-H", f"{key}: {value}"])
    if data:
        args.extend(["-d", data])
    args.append(url)
    result = subprocess.run(
        args, capture_output=True, text=True, timeout=30, check=False
    )
    if result.returncode != 0:
        detail = " ".join(
            part.strip() for part in (result.stderr, result.stdout) if part.strip()
        )
        return f"curl failed (exit {result.returncode}): {detail}"
    return result.stdout or result.stderr
