"""Names, environment and provenance shared by every experiment."""

import hashlib
import os
import subprocess
from pathlib import Path

# The state keys that describe a location rather than what was fetched about it.
# Every dataset's example inputs carry these; only the score dataset adds more.
STATE_INPUTS = ("latitude", "longitude", "date", "timezone", "location_slug")

# The five fetch keys, in the order `score_nodes.SECTIONS` lays them out.
FETCH_SOURCES = ("water_quality", "tides", "weather", "marine", "sun_times")

# The three fetched by a ReAct agent, and so the three worth evaluating as agents.
AGENT_SOURCES = ("tides", "marine", "sun_times")

# The two fetched by plain Python, evaluated only to catch an upstream API change
# that the unit tests' inlined samples cannot see.
SOURCE_SOURCES = ("water_quality", "weather")

# The sources whose answers are astronomy rather than forecast: tide turning
# points and solar times for a date and a coordinate do not change, so a captured
# answer stays right and becomes a golden to match against rather than merely a
# plausible shape. Being in this map is what makes a source golden, and the value
# is how far an answer may drift — tides are predicted to the minute, but the
# agents transcribing them round.
GOLDEN_TOLERANCE_MINUTES = {"tides": 10, "sun_times": 2}

ACTIVITIES = ("sup", "kayaking", "snorkelling", "cycling")

# Prefixed so they group in the LangSmith dataset list. A model or a date never
# belongs in a dataset name — that is what an experiment records.
SCORE_DATASET = "bw-score"
GRAPH_DATASET = "bw-forecast-e2e"

SEEDS_DIR = Path(__file__).parent / "seeds"
SCORE_PROMPT = Path(__file__).parent.parent / "prompts" / "score.txt"


def fetch_dataset(source):
    """Name the dataset for one fetch source, e.g. `bw-fetch-sun-times`."""
    prefix = "bw-source" if source in SOURCE_SOURCES else "bw-fetch"
    return f"{prefix}-{source.replace('_', '-')}"


def setup_environment():
    """Load `.env` and turn tracing on, before anything imports a model module.

    `langraph/models/score_llm.py` builds its singleton at import time and reads
    `OPENROUTER_API_KEY` while doing so, so an import that happens before this
    runs gets a client with no credentials. Every command in `cli.py` calls this
    first and imports the rest of the harness afterwards.
    """
    from dotenv import load_dotenv

    load_dotenv()
    os.environ.setdefault("LANGSMITH_TRACING", "true")


def _git_sha():
    """Name the commit the harness is running from, or None outside a checkout."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, check=True, cwd=Path(__file__).parent,
        )
    except (OSError, subprocess.CalledProcessError):
        return None
    return result.stdout.strip()


def score_prompt_sha():
    """Digest `prompts/score.txt`, so an experiment records which prompt ran.

    The prompt is not part of the dataset, so without this a metric that moved
    between two experiments cannot be attributed to the model or to the prompt.
    """
    return hashlib.sha256(SCORE_PROMPT.read_bytes()).hexdigest()[:12]


def experiment_metadata(provider=None, model=None, effort=None, **extra):
    """Describe an experiment so LangSmith can group and compare it later.

    Args:
        provider: The provider under test, or None for whatever the environment
            names.
        model: The model under test, or None for that provider's default.
        effort: The reasoning effort under test, or None for the provider's own.
        **extra: Anything else worth recording against the experiment.

    Returns:
        The metadata dict to hand to `evaluate()`.
    """
    return {
        "provider": provider or os.environ.get("LANGGRAPH_LLM_PROVIDER", "openrouter"),
        "model": model or "default",
        "effort": effort or "default",
        "git_sha": _git_sha(),
        "score_prompt_sha": score_prompt_sha(),
        "harness": "langraph.evals",
        **extra,
    }
