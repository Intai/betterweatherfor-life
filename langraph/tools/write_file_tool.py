from langchain_core.tools import tool


@tool
def write_file(file_path: str, content: str) -> str:
    """Write content to a file.

    Args:
        file_path: Path to the file to write.
        content: The content to write to the file.
    """
    with open(file_path, "w") as f:
        f.write(content)
    return f"Written to {file_path}"
