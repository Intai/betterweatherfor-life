"""The committed fetch captures every score experiment is scored against.

A seed is one location on one date with all five fetch sources already fetched,
so a score experiment varies only the scorer. Without that, comparing two models
would also be comparing two different weather forecasts.

The dates are never rebased. `forecast_dates()` expands the ten scored days from
the seed's own `date`, and every fetched row is stamped against that same date,
so an old seed stays internally consistent and remains a valid scoring problem
indefinitely. Shifting the date forward would desynchronise the rows from the
days being asked about and every coverage evaluator would fire at once.
"""

import json
import uuid

from langraph.evals.config import FETCH_SOURCES, SEEDS_DIR, STATE_INPUTS

# A fixed namespace, so a seed's row lands on the same id on every machine and
# every push. Any constant would do; it only has to never change.
NAMESPACE = uuid.uuid5(uuid.NAMESPACE_URL, "betterweatherfor.life/langraph/evals")


def seed_path(slug, date):
    """Name the file a seed for one location and date lives in."""
    return SEEDS_DIR / f"{slug}-{date}.json"


def seed_id(slug, date):
    """Identify a seed, for keying dataset examples so a push can upsert."""
    return f"{slug}-{date}"


def example_id(key):
    """Derive the LangSmith id a seed's row always lands on.

    LangSmith assigns a random id per create, which would leave a second push no
    way to tell an existing row from a new one — and a dataset that doubles on
    every push doubles the cost of every experiment run over it. Deriving the id
    from the seed instead makes a re-push an update by construction, with nothing
    stored anywhere to correlate the two.

    Args:
        key: The row's name, as `datasets._example_key` builds one.

    Returns:
        A UUID, the same one for that key on every machine and every run.
    """
    return uuid.uuid5(NAMESPACE, key)


def write_seed(seed):
    """Write a seed to `langraph/evals/seeds/`, returning the path.

    Args:
        seed: A seed record, as `capture.capture_seed` builds one.

    Returns:
        The path written.
    """
    inputs = seed["inputs"]
    path = seed_path(inputs["location_slug"], inputs["date"])
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(seed, indent=2, sort_keys=True) + "\n")
    return path


def read_seed(path):
    """Read one seed file."""
    return json.loads(path.read_text())


def load_seeds(slug=None):
    """Read every committed seed, newest filename first.

    Args:
        slug: Keep only the seeds for one location, or None for all of them.

    Returns:
        A list of seed records.
    """
    if not SEEDS_DIR.exists():
        return []
    seeds = [read_seed(path) for path in sorted(SEEDS_DIR.glob("*.json"))]
    if slug:
        seeds = [seed for seed in seeds if seed["inputs"]["location_slug"] == slug]
    return seeds


def seed_state(seed, sources=FETCH_SOURCES):
    """Rebuild the `ForecastState` a seed froze.

    Args:
        seed: A seed record.
        sources: The fetch keys to include, for a target that only needs some.

    Returns:
        A state dict of the five location keys plus each requested fetch string.
    """
    state = {key: seed["inputs"][key] for key in STATE_INPUTS}
    fetched = seed.get("fetch") or {}
    state.update({key: fetched[key] for key in sources if fetched.get(key)})
    return state


def describe(seed):
    """Summarise a seed in one line, for a CLI listing."""
    inputs = seed["inputs"]
    captured = sorted(key for key, value in (seed.get("fetch") or {}).items() if value)
    return (
        f"{inputs['location_slug']} {inputs['date']} "
        f"({len(captured)}/{len(FETCH_SOURCES)} sources: {', '.join(captured)})"
    )
