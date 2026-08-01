import subprocess

from langchain_core.tools import tool


@tool
def curl(
    url: str, method: str = "GET", headers: dict | None = None, data: str | None = None
) -> str:
    """Fetch data from a URL using curl.

    Args:
        url: The URL to fetch.
        method: HTTP method (GET, POST, PUT, DELETE).
        headers: Optional dict of HTTP headers (e.g. {"accept": "text/csv"}).
        data: Optional request body payload.
    """
    args = ["curl", "-s", "-f", "-X", method]
    for key, value in (headers or {}).items():
        args.extend(["-H", f"{key}: {value}"])
    if data:
        args.extend(["-d", data])
    args.append(url)
    result = subprocess.run(
        args, capture_output=True, text=True, timeout=30, check=False
    )
    return result.stdout or result.stderr
