"""Tests for recording a fetch phase into a seed.

Safe under `tests/conftest.py`: `capture.py` imports only `config` and `seeds` at
module level and defers `graph`, `fetch_llm` and `langsmith` into the functions
that need them, so patching `fetch_source` keeps everything here off the network.

Every test injects `now`, so none of them reads a clock and none of them can go
green today and red at a timezone boundary.
"""

from datetime import datetime, timedelta, timezone
from unittest.mock import patch

from langraph.evals.capture import capture_from_run, capture_seed, digest

COLUMNAR = '{"fields":["time","v"],"rows":[["2026-03-24T06:00",1]]}'
NOW = "2026-08-08T14:32:07+12:00"
INPUTS = {
    "latitude": "-36.8506", "longitude": "174.8329", "date": "2026-03-24",
    "timezone": "Pacific/Auckland", "location_slug": "mission-bay",
}


def clock(stamp=NOW):
    return lambda: stamp


def seed(captured_at="2026-01-02T08:00:00+13:00", sources=("tides", "weather")):
    return {
        "captured_at": captured_at,
        "inputs": dict(INPUTS),
        "fetch": {source: COLUMNAR for source in sources},
        "provenance": {"fetch_model": "sonnet", "failures": None},
    }


class FakeRun:
    """A traced run as `capture_from_run` reads one."""

    def __init__(self, start_time=None, children=(), inputs=None):
        self.start_time = start_time
        self.child_runs = list(children)
        self.inputs = inputs if inputs is not None else dict(INPUTS)


class FakeChild:
    def __init__(self, name, value=COLUMNAR):
        self.name = name
        self.outputs = {name: value}


def test_digest_summarises_a_columnar_answer():
    assert digest(COLUMNAR) == (
        "1 rows, 2026-03-24T06:00 .. 2026-03-24T06:00, fields time, v"
    )


def test_digest_names_what_made_an_answer_unreadable():
    assert digest("not json").startswith("unreadable:")


def test_capture_stamps_when_the_data_was_fetched():
    with patch("langraph.evals.capture.fetch_source", return_value=COLUMNAR):
        built = capture_seed(INPUTS, sources=("tides",), report=lambda _: None,
                             now=clock())

    assert built["captured_at"] == NOW


def test_re_capturing_one_source_re_stamps_the_seed():
    """The whole point of the field: when did we last go and get this data.

    It used to be assigned from a flag with no default, so a re-capture that did
    not repeat the flag replaced a good timestamp with None.
    """
    existing = seed()
    with patch("langraph.evals.capture.fetch_source", return_value=COLUMNAR):
        built = capture_seed(INPUTS, sources=("tides",), existing=existing,
                             report=lambda _: None, now=clock())

    assert built["captured_at"] == NOW
    assert built["fetch"]["weather"] == COLUMNAR  # the untouched source survives


def test_a_failed_source_still_stamps_the_capture():
    with patch("langraph.evals.capture.fetch_source", side_effect=RuntimeError("503")):
        built = capture_seed(INPUTS, sources=("tides",), report=lambda _: None,
                             now=clock())

    assert built["captured_at"] == NOW
    assert built["provenance"]["failures"] == {"tides": "RuntimeError: 503"}


def test_mining_a_run_stamps_it_with_when_that_run_started():
    """Not the clock — the fetch already happened, and dating it now would read
    as fresh on exactly the seeds most likely to be stale."""
    started = datetime(2026, 7, 1, 21, 30, tzinfo=timezone(timedelta(hours=12)))
    run = FakeRun(start_time=started, children=[FakeChild("tides")])

    with patch("langsmith.Client") as client:
        client.return_value.read_run.return_value = run
        built = capture_from_run("run-1", report=lambda _: None)

    assert built["captured_at"] == "2026-07-01T21:30:00+12:00"


def test_a_naive_run_time_is_read_as_utc():
    """LangSmith hands back naive UTC, which would otherwise compare wrong
    against the local stamps a fresh capture writes."""
    naive = datetime(2026, 7, 1, 9, 30)  # noqa: DTZ001 — being naive is the case under test
    run = FakeRun(start_time=naive, children=[FakeChild("tides")])

    with patch("langsmith.Client") as client:
        client.return_value.read_run.return_value = run
        built = capture_from_run("run-1", report=lambda _: None)

    assert built["captured_at"] == "2026-07-01T09:30:00+00:00"


def test_a_run_without_a_start_time_stamps_nothing():
    run = FakeRun(start_time=None, children=[FakeChild("tides")])

    with patch("langsmith.Client") as client:
        client.return_value.read_run.return_value = run
        built = capture_from_run("run-1", report=lambda _: None)

    assert built["captured_at"] is None
