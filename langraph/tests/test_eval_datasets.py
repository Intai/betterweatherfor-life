"""Tests for building and pushing the eval datasets.

Safe under `tests/conftest.py`: `datasets.py` imports only `config` and `seeds`,
and defers the `langsmith` import into `_client()`, so nothing here reaches a
model or the network.
"""

from unittest.mock import patch

import pytest

from langraph.evals.config import ACTIVITIES, FETCH_SOURCES, SCORE_DATASET
from langraph.evals.datasets import (
    fetch_examples,
    graph_examples,
    push,
    score_examples,
    upsert_examples,
)
from langraph.evals.seeds import example_id

COLUMNAR = '{"fields":["time","v"],"rows":[["2026-03-24T06:00",1]]}'


def seed(slug="mission-bay", date="2026-03-24", sources=FETCH_SOURCES):
    return {
        "captured_at": "2026-08-07T09:12:44+12:00",
        "inputs": {
            "latitude": "-36.8485", "longitude": "174.7633", "date": date,
            "timezone": "Pacific/Auckland", "location_slug": slug,
        },
        "fetch": {source: COLUMNAR for source in sources},
    }


class FakeExample:
    def __init__(self, id):
        self.id = id


class FakeClient:
    """Records what a push asked for, and remembers it for the next push."""

    def __init__(self):
        self.datasets = {}
        self.examples = {}
        self.created, self.updated = [], []

    def has_dataset(self, dataset_name=None):
        return dataset_name in self.datasets

    def read_dataset(self, dataset_name=None):
        return self.datasets[dataset_name]

    def create_dataset(self, name, description=None):
        dataset = FakeExample(f"dataset-{name}")
        self.datasets[name] = dataset
        self.examples.setdefault(dataset.id, [])
        return dataset

    def list_examples(self, dataset_id=None):
        return list(self.examples.get(dataset_id, []))

    def create_examples(self, dataset_id=None, examples=None):
        self.created.extend(examples)
        self.examples.setdefault(dataset_id, []).extend(
            FakeExample(example["id"]) for example in examples
        )

    def update_examples(self, dataset_id=None, updates=None):
        self.updated.extend(updates)


# --- the property the whole mechanism exists for ----------------------------

def test_pushing_the_same_seeds_twice_updates_rather_than_duplicates():
    # A blind create would double the dataset on every push, and double the cost
    # of every experiment run over it.
    client = FakeClient()
    examples = score_examples([seed()])

    first = upsert_examples(SCORE_DATASET, "desc", examples, client=client)
    second = upsert_examples(SCORE_DATASET, "desc", examples, client=client)

    assert first == (len(ACTIVITIES), 0)
    assert second == (0, len(ACTIVITIES))
    assert len(client.list_examples("dataset-" + SCORE_DATASET)) == len(ACTIVITIES)


def test_a_second_push_reuses_the_ids_the_first_created():
    client = FakeClient()
    examples = score_examples([seed()])

    upsert_examples(SCORE_DATASET, "desc", examples, client=client)
    upsert_examples(SCORE_DATASET, "desc", examples, client=client)

    assert [row["id"] for row in client.created] == [row["id"] for row in client.updated]


def test_a_new_seed_is_created_alongside_the_ones_already_there():
    client = FakeClient()

    upsert_examples(SCORE_DATASET, "desc", score_examples([seed()]), client=client)
    created, updated = upsert_examples(
        SCORE_DATASET, "desc",
        score_examples([seed(), seed(slug="piha")]),
        client=client,
    )

    assert (created, updated) == (len(ACTIVITIES), len(ACTIVITIES))


# --- the derived id ---------------------------------------------------------

def test_example_id_is_stable_across_calls():
    assert example_id("mission-bay-2026-03-24-sup") == \
        example_id("mission-bay-2026-03-24-sup")


def test_example_id_separates_activities_sources_and_locations():
    ids = {
        example_id("mission-bay-2026-03-24-sup"),
        example_id("mission-bay-2026-03-24-cycling"),
        example_id("mission-bay-2026-03-24-tides"),
        example_id("piha-2026-03-24-sup"),
        example_id("mission-bay-2026-06-11-sup"),
    }
    assert len(ids) == 5


# --- what each builder produces ---------------------------------------------

def test_score_examples_cover_every_activity_with_every_source():
    examples = score_examples([seed()])

    assert len(examples) == len(ACTIVITIES)
    assert {example["split"] for example in examples} == set(ACTIVITIES)
    for example in examples:
        # Every source, not just the ones the activity uses: `_build_fetched_data`
        # already filters by ACTIVITY_SOURCES, so cycling drops the water ones
        # without the dataset needing to know that it should.
        assert all(example["inputs"][source] for source in FETCH_SOURCES)
        assert example["metadata"]["slug"] == "mission-bay"


def test_score_examples_tolerate_a_seed_missing_a_source():
    examples = score_examples([seed(sources=("weather", "sun_times"))])
    assert examples[0]["inputs"]["tides"] == ""


@pytest.mark.parametrize("source", ["tides", "sun_times"])
def test_fetch_examples_carry_a_golden_for_the_deterministic_sources(source):
    # Tide turning points and solar times for a date and coordinate are
    # astronomy, so a capture stays right and becomes something to match against.
    example, = fetch_examples([seed()], source)
    assert example["outputs"] == {source: COLUMNAR}


@pytest.mark.parametrize("source", ["marine", "weather", "water_quality"])
def test_fetch_examples_leave_live_forecasts_without_a_golden(source):
    # A captured forecast would be a stale answer masquerading as a correct one.
    example, = fetch_examples([seed()], source)
    assert example["outputs"] == {}


def test_fetch_examples_send_only_the_location_since_the_target_fetches_live():
    example, = fetch_examples([seed()], "marine")
    assert set(example["inputs"]) == {"latitude", "longitude", "date", "timezone",
                                      "location_slug"}


def test_graph_examples_are_one_row_per_location():
    examples = graph_examples([seed(), seed(slug="piha")])
    assert len(examples) == 2
    assert {example["key"] for example in examples} == {
        "mission-bay-2026-03-24", "piha-2026-03-24",
    }


# --- push -------------------------------------------------------------------

def test_push_refuses_when_nothing_has_been_captured():
    # Otherwise it reports a successful push of nothing at all.
    with patch("langraph.evals.datasets.load_seeds", return_value=[]), \
         pytest.raises(ValueError, match="No seeds to push"):
        push(client=FakeClient(), report=lambda _: None)


def test_push_fills_every_dataset_a_seed_feeds():
    client = FakeClient()
    with patch("langraph.evals.datasets.load_seeds", return_value=[seed()]):
        results = push(client=client, report=lambda _: None)

    # One score dataset, five fetch/source datasets, one end-to-end.
    assert len(results) == 1 + len(FETCH_SOURCES) + 1
    assert results[SCORE_DATASET] == (len(ACTIVITIES), 0)
