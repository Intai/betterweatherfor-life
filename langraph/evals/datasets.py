"""Pushing the committed seeds up into LangSmith datasets.

A dataset is the hosted copy of the seeds: `evaluate()` reads examples, not
files, and it is the stable example ids that let two experiments be compared row
by row rather than only in aggregate.

Pushing is therefore an upsert, never a blind create — a second push would
otherwise double the dataset and double the bill of every run over it. Each row's
id is derived from the seed that built it by `seeds.example_id`, so re-pushing
lands on the same rows by construction and nothing has to be stored to correlate
one push with the next.
"""

from langraph.evals.config import (
    ACTIVITIES,
    AGENT_SOURCES,
    FETCH_SOURCES,
    GOLDEN_TOLERANCE_MINUTES,
    GRAPH_DATASET,
    SCORE_DATASET,
    SOURCE_SOURCES,
    STATE_INPUTS,
    fetch_dataset,
)
from langraph.evals.seeds import example_id, load_seeds, seed_id


def _client():
    from langsmith import Client

    return Client()


def ensure_dataset(name, description, client=None):
    """Read a dataset by name, creating it the first time.

    Args:
        name: The dataset name.
        description: Shown in the LangSmith dataset list.
        client: An existing client, or None to build one.

    Returns:
        The dataset.
    """
    client = client or _client()
    if client.has_dataset(dataset_name=name):
        return client.read_dataset(dataset_name=name)
    return client.create_dataset(name, description=description)


def upsert_examples(name, description, examples, client=None):
    """Push examples into a dataset, updating the ones already there.

    Args:
        name: The dataset name.
        description: Used only when the dataset is being created.
        examples: Dicts of `{key, inputs, outputs, metadata, split}`, where `key`
            names the row and decides the id it lands on.
        client: An existing client, or None to build one.

    Returns:
        A `(created, updated)` count pair.
    """
    client = client or _client()
    dataset = ensure_dataset(name, description, client=client)

    known = {example.id for example in client.list_examples(dataset_id=dataset.id)}

    creates, updates = [], []
    for example in examples:
        payload = {
            "id": example_id(example["key"]),
            "inputs": example["inputs"],
            "outputs": example.get("outputs") or {},
            "metadata": example.get("metadata", {}),
        }
        if example.get("split"):
            payload["split"] = example["split"]
        (updates if payload["id"] in known else creates).append(payload)

    if creates:
        client.create_examples(dataset_id=dataset.id, examples=creates)
    if updates:
        client.update_examples(dataset_id=dataset.id, updates=updates)
    return len(creates), len(updates)


def _example_key(seed, suffix=None):
    """Name the row a seed feeds, per activity for scoring or per source for fetch."""
    key = seed_id(seed["inputs"]["location_slug"], seed["inputs"]["date"])
    return f"{key}-{suffix}" if suffix else key


def _location_inputs(seed):
    """Take the five keys that describe a location, without the fetched data."""
    return {key: seed["inputs"][key] for key in STATE_INPUTS}


def _metadata(seed, **extra):
    inputs = seed["inputs"]
    return {
        "slug": inputs["location_slug"],
        "date": inputs["date"],
        "captured_at": seed.get("captured_at"),
        **extra,
    }


def score_examples(seeds):
    """Build one example per seed and activity, for the score dataset.

    The example inputs carry every fetch source rather than only the ones the
    activity uses: `score_nodes._build_fetched_data` already filters by
    `ACTIVITY_SOURCES`, so cycling drops tides, marine and water quality without
    the dataset needing to know that it should.

    Args:
        seeds: The seed records to build from.

    Returns:
        Example dicts, split by activity.
    """
    examples = []
    for seed in seeds:
        fetched = seed.get("fetch") or {}
        for activity in ACTIVITIES:
            examples.append({
                "key": _example_key(seed, activity),
                "split": activity,
                "inputs": {
                    **_location_inputs(seed),
                    "activity": activity,
                    **{source: fetched.get(source, "") for source in FETCH_SOURCES},
                },
                "metadata": _metadata(seed, activity=activity),
            })
    return examples


def fetch_examples(seeds, source):
    """Build one example per seed for a single fetch source.

    The example inputs are only the location: the target fetches live. A captured
    answer becomes `reference_outputs` for the two sources whose answers are
    deterministic, and is left off the rest, where it would be a stale forecast
    masquerading as a correct one.
    """
    examples = []
    for seed in seeds:
        captured = (seed.get("fetch") or {}).get(source)
        golden = source in GOLDEN_TOLERANCE_MINUTES and captured
        examples.append({
            "key": _example_key(seed, source),
            "inputs": _location_inputs(seed),
            "outputs": {source: captured} if golden else {},
            "metadata": _metadata(seed, source=source),
        })
    return examples


def graph_examples(seeds):
    """Build the end-to-end examples, which are the location keys and nothing else."""
    return [
        {
            "key": _example_key(seed),
            "inputs": _location_inputs(seed),
            "metadata": _metadata(seed),
        }
        for seed in seeds
    ]


DESCRIPTIONS = {
    SCORE_DATASET: (
        "Frozen fetch data per location, date and activity. The scorer runs "
        "against captured sources so a model comparison is not also a comparison "
        "of two different weather forecasts."
    ),
    GRAPH_DATASET: (
        "Locations for the end-to-end forecast graph. Live data, so this is an "
        "integration check rather than a model comparison."
    ),
}


def dataset_description(name):
    """Describe a dataset for the LangSmith list, defaulting per fetch source."""
    if name in DESCRIPTIONS:
        return DESCRIPTIONS[name]
    live = "against live APIs" if name.startswith("bw-source") else "via its ReAct agent"
    return f"Locations for one fetch source, fetched {live}."


def push(which="all", slug=None, client=None, report=print):
    """Upsert the committed seeds into every dataset they feed.

    Args:
        which: `score`, `fetch`, `source`, `graph`, or `all`.
        slug: Push only one location's seeds, or None for all of them.
        client: An existing client, or None to build one.
        report: Where to write a line per dataset.

    Returns:
        A `{dataset_name: (created, updated)}` map.

    Raises:
        ValueError: If there are no seeds to push, which otherwise looks like a
            successful push of nothing.
    """
    seeds = load_seeds(slug)
    if not seeds:
        raise ValueError(
            "No seeds to push — capture one first with "
            "`python -m langraph.evals.cli capture ...`"
        )

    client = client or _client()
    plan = {}
    if which in ("score", "all"):
        plan[SCORE_DATASET] = score_examples(seeds)
    if which in ("fetch", "all"):
        for source in AGENT_SOURCES:
            plan[fetch_dataset(source)] = fetch_examples(seeds, source)
    if which in ("source", "all"):
        for source in SOURCE_SOURCES:
            plan[fetch_dataset(source)] = fetch_examples(seeds, source)
    if which in ("graph", "all"):
        plan[GRAPH_DATASET] = graph_examples(seeds)

    results = {}
    for name, examples in plan.items():
        created, updated = upsert_examples(
            name, dataset_description(name), examples, client=client
        )
        results[name] = (created, updated)
        report(f"  {name}: {created} created, {updated} updated")
    return results
