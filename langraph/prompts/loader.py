from pathlib import Path


def load_prompt(template_name, **kwargs):
    """Load a .txt prompt template and interpolate variables."""
    path = Path(__file__).parent / f"{template_name}.txt"
    template = path.read_text()
    return template.format(**kwargs)
