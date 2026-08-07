"""LangSmith evaluations for the forecast graph.

Deliberately outside `langraph/tests/`: that package's `conftest.py` replaces the
model modules with `MagicMock`s at import time, so an experiment collected by
pytest would score a mock and report a perfect result. Nothing here is named
`test_*.py`, and the harness runs through `python -m langraph.evals.cli`. The
unit tests for the evaluators themselves live in `langraph/tests/`, which is safe
because they import only pure functions from `langraph.evals.evaluators`.
"""
