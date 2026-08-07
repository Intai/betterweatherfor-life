"""What a run is checked for, split into catalogues and the suites using them.

`score.py`, `fetch.py`, `judges.py` and `summaries.py` are catalogues: each holds
the checks for one kind of output, as plain functions over plain dicts. `suites.py`
says which of them a given experiment reports, wiring each up with
`common.bind`.
"""
