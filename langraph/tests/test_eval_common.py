"""Tests for `langraph.evals.evaluators.common` — the wiring and run health.

`columnar_contract` stands in as the subject of the `bind` test simply because a
catalogue entry taking a bound extra is what `bind` exists for.
"""

import pytest

from langraph.evals.evaluators.common import bind, call_with, run_health
from langraph.evals.evaluators.fetch import EXPECTED_FIELDS, columnar_contract
from langraph.tests.eval_builders import INPUTS, columnar, find

# --- run health -------------------------------------------------------------

def test_run_health_reports_the_thinking_share():
    outputs = {"_meta": {"output_tokens": 20000, "reasoning_tokens": 7000,
                         "seconds": 91.5}}
    result = run_health(outputs)
    assert find(result, "thinking_share")["score"] == pytest.approx(0.35)
    assert find(result, "succeeded")["score"] is True


def test_run_health_reports_a_swallowed_failure():
    outputs = {"_meta": {"error": "ValueError: not valid JSON"}}
    result = run_health(outputs)
    assert find(result, "succeeded")["score"] is False
    assert "not valid JSON" in find(result, "succeeded")["comment"]


def test_run_health_reports_an_answer_cut_off_at_the_token_cap():
    result = run_health({"_meta": {"truncated": "length"}})
    assert find(result, "completed")["score"] is False
    assert find(result, "completed")["comment"] == "length"


def test_run_health_names_the_good_outcome_so_one_is_always_the_good_end():
    # The whole point of the naming: a healthy run reads True on every boolean,
    # so no column in the experiment table has to be read backwards.
    healthy = run_health({"_meta": {"output_tokens": 20000, "seconds": 90}})
    booleans = {entry["key"]: entry["score"] for entry in healthy["results"]
                if isinstance(entry["score"], bool)}

    assert booleans == {"succeeded": True, "completed": True}


def test_run_health_tolerates_a_provider_that_sent_no_usage():
    result = run_health({"_meta": {}})
    assert find(result, "thinking_share")["score"] is None


# --- wiring -----------------------------------------------------------------

def test_call_with_passes_only_what_an_evaluator_declares():
    # Catalogue entries take only what they need, so every caller offers
    # everything and lets the signature decide.
    def wants_outputs(outputs):
        return outputs

    def wants_both(inputs, outputs):
        return (inputs, outputs)

    offered = {"inputs": "i", "outputs": "o", "reference_outputs": "r", "source": "tides"}

    assert call_with(wants_outputs, **offered) == "o"
    assert call_with(wants_both, **offered) == ("i", "o")


def test_call_with_passes_a_bound_extra_when_it_is_declared():
    def wants_source(outputs, source):
        return f"{outputs}:{source}"

    assert call_with(wants_source, inputs="i", outputs="o", source="tides") == "o:tides"


def test_bind_hands_langsmith_a_three_argument_evaluator():
    bound = bind(columnar_contract, "tides.columnar_contract", source="tides")
    result = bound(INPUTS, {"tides": columnar(EXPECTED_FIELDS["tides"], [])}, None)
    assert bound.__name__ == "tides.columnar_contract"
    assert find(result, "fields_exact")["score"] is True
