# LangSmith evaluations

Model and prompt choices used to be decided by setting `LANGGRAPH_SCORE_MODEL`,
running the graph once and reading one trace by hand. The findings survived only
as comments in `models/score_llm.py`. This turns those readings into experiments
that can be re-run, compared side by side and regression-checked.

## Seeds, datasets and experiments

Three different things:

- **Seed** — a JSON file in `seeds/`, committed to git. The reviewable source of
  truth, holding one location's fetch phase already fetched.
- **Dataset** — the LangSmith-hosted copy. Each row is an *example*:
  `{inputs, reference_outputs?, metadata}`. `evaluate()` reads examples, not
  files.
- **Experiment** — one `evaluate()` run over a dataset, one result row per
  example with the evaluator scores attached.

Two layers rather than feeding seed files straight into `evaluate()`, because two
experiments can only be compared row by row when they ran over the same example
ids. That is what shows *which* location regressed rather than only that the
average moved.

Capture is rare and hand-reviewed; push is a sync; experiments read the datasets
constantly.

```
seeds/mission-bay-2026-03-24.json
├── inputs {lat, lng, date, timezone, slug}   ← tiny; every suite needs this
└── fetch  {water_quality, tides, weather, marine, sun_times}
             ├──> bw-score            as example INPUTS
             ├──> bw-fetch-tides      as reference_outputs (golden)
             ├──> bw-fetch-sun-times  as reference_outputs (golden)
             └──  bw-fetch-marine, bw-source-*, bw-forecast-e2e
                  unused — those targets fetch live
```

Only `bw-score` uses the frozen fetch block as *input*. That is the point of
freezing it: without it, comparing two scorers would also be comparing two
different weather forecasts.

## Suites

| Suite | Target | LLM calls | Inputs | Sweeps models | Purpose |
|---|---|---|---|---|---|
| `fetch --source weather\|water_quality` | the source function | none | live | n/a | upstream API drift |
| `fetch --source tides\|marine\|sun_times` | `build_fetch_graph(source)` | ReAct + curl | live | yes | agent correctness |
| `score` | `score_activity` | 1 per example | frozen seeds | yes | model and prompt choices |
| `e2e` | `build_graph()` | ~9 per run | live | no | integration regression |

The end-to-end suite deliberately takes no `--models`: it would pay for the whole
fetch phase once per model, and the live data drifting underneath would confound
the comparison anyway. Compare models per node, where the inputs hold still.

The corollary is the one thing to remember before running it: with no `--models` to
pin, `e2e` uses whatever `LANGGRAPH_LLM_PROVIDER` in `.env` names. **Check that
first.** The experiment records the provider it used, so it is recoverable
afterwards — but reading an `e2e` result against `gates.py`, whose floors describe
one model, is meaningless until you know which model actually ran.

## Running

```sh
make langraph-capture EVAL_ARGS="--slug mission-bay --lat -36.8485 --lng 174.7633 \
    --date 2026-03-24 --timezone Pacific/Auckland"   # then review and commit the seed
make langraph-push
make langraph-score EVAL_ARGS="--activity sup --limit 1"
make langraph-fetch EVAL_ARGS="--source tides"
make langraph-e2e
```

## Comparing models

`--models` runs one experiment per spec over the same examples, so LangSmith lines
them up row by row. It works the same on both suites:

```sh
make langraph-score EVAL_ARGS="--models xai=low,gemini=medium --activity sup"
make langraph-fetch EVAL_ARGS="--source marine --models xai=low,gemini=medium"
```

A spec is `provider:model=effort` and any part may be omitted, so `gemini=medium`
means that provider's default model at medium effort and `xai` means its defaults
throughout. Separate several with commas or repeat `--models`; both sweep.

Effort is separated by `=` rather than a third colon because model names carry
colons of their own — the OpenRouter default here is
`nvidia/nemotron-3-ultra-550b-a55b:free`, and splitting a spec on colons would drop
the `:free` suffix and read it as the effort. So the full form is
`openrouter:nvidia/nemotron-3-ultra-550b-a55b:free=low`.

Each model is built once and handed to the target rather than read from the
environment mid-run, which is what stops a sweep measuring one model and labelling
the results with another.

Needs `LANGSMITH_API_KEY` in `.env`. The Makefile exports it; the CLI also calls
`load_dotenv()` before importing anything that builds a model.

## Judging

Two of the score metrics are graded by a model rather than a rule. They are
opt-in, because they roughly double the cost of an experiment and are the least
reliable signal in it. `--judge` turns them on, and takes the same
`provider:model=effort` spec as `--models` to say who grades:

```sh
make langraph-score EVAL_ARGS="--activity sup --judge"          # default examiner
make langraph-score EVAL_ARGS="--judge claude-cli:opus=medium --models gemini=low"
```

Any part left out falls back to the default examiner,
`openai:gpt-5.6-terra=medium` — a reasoning model at a real effort rather than
the cheapest thing that answers, because `analysis_quality` asks for taste no
rule supplies. `score_plausibility` only applies the stated bands, where
capability buys little beyond fewer arithmetic slips.

The second example is the case worth remembering: the default judge is an OpenAI
model, so a sweep of OpenAI models — which reach the scorer through OpenRouter —
would be close to self-grading. A model of the same family marks it generously,
and that skews a comparison more than a weak judge does — a weak judge is at
least weak uniformly across every column. For the same reason, move the judge
between sweeps rather than within one; the experiment metadata records which
examiner graded each run.

## Reading the results

By default nothing decides pass or fail: each evaluator reports a number,
LangSmith stores it as feedback, and you read the columns. `--gate` is what turns
some of those numbers into an exit code — see below. Either way it matters what
kind of number each one is:

| Family | Metrics | Reading |
|---|---|---|
| 0–1 ratio | coverage, discipline, consistency, `golden_match`, the judges | higher is better |
| Boolean | `succeeded`, `completed`, `parse_clean`, `rows_ordered`, `columnar_parseable`, `fields_exact` | True is better |
| Magnitude | `parse_problems`, `seconds`, `output_tokens` | lower is better, unbounded |
| Informational | `thinking_share` | no good direction; compare between experiments |
| About the seed | `seed_sources_given` | a low value means your capture is incomplete, not that the model did badly |

Every score and boolean points the same way, so `1.0` is always the good end. The
magnitudes are the exception, and none of them is gated — `parse_problems` has
`parse_clean` beside it precisely so no threshold table has to hold an entry that
runs backwards.

Read `succeeded` and `completed` first. Targets report their failures rather than
raising, so every row in LangSmith looks successful — a strong `band_consistency`
over the 40% of examples that returned is worse than a middling one over all of
them. `usable_run_rate` is the gate.

`temperature=0` is not determinism for a reasoning model. Use `--repetitions 3`
for anything you would act on, prefer three seeds three times over nine seeds
once, compare the medians the summary evaluators report, and treat a gap under
about 0.05 as indistinguishable. Binary metrics are the exception: one truncation
is a production incident even at n=3.

Do not sweep on a `:free` OpenRouter model — shared capacity and per-minute caps
mean you would be measuring queue depth.

## Gating

`--gate` makes an experiment exit non-zero. It is a switch, not a threshold:
every criterion lives in `gates.py`, so there is no number on the command line to
get backwards, and a tolerance can only change in a commit that says why.

Three layers, in this order:

1. **`usable_run_rate` must reach `USABLE_RUN_RATE_FLOOR`.** A precondition, not a
   peer threshold. A score target that raised returns `forecast: {}` and
   `problems: []`, which reads as `parse_clean` True and turns every ratio into
   `None` — so both tables below pass a run that produced nothing at all.
2. **`HARD` must be exact.** Schema, dataset integrity, and the two golden
   comparisons. These values were knowable before any experiment ran.
3. **`FLOORS` must be cleared.** Rule conformance over live model output, measured
   rather than guessed — 12 usable claude-cli runs, four activities at
   `--repetitions 3`.

A floor sits *below* the worst healthy observation, never at the median: a gate
level with the median fails half the time by construction. Most of these metrics
divide by an entry count, so a single band-edge slip in forty entries reads as
0.975, and three of them did exactly that — `band_consistency` on cycling and
snorkelling, `hourly_entry_agreement` on cycling, `factor_completeness` on sup. Their
floors sit one slip lower again.

They are calibrated from the shipped model's headroom, not to separate it from a bad
one — catching another model is a side effect, and a weak one. grok fails
`band_consistency` decisively on frozen seeds (0.525-0.75) but scored 0.9444 on a live
end-to-end run, clearing 0.95 by almost nothing. This is a regression gate, not a
model classifier; that is what `--models` and the LangSmith columns are for.

`FLOORS` was calibrated at one `score_prompt_sha`, recorded in
`gates.CALIBRATED_PROMPT_SHA`. Run against a different prompt and the gate says so
rather than blaming the model; a real prompt change means re-measuring.

## Where the rules live

`evaluators/score.py` mirrors `prompts/score.txt`: which factors each activity
carries, that the worst factor decides the entry, that snorkelling's temperature
never does. Change that prompt and these have to follow, or they will keep
reporting confident numbers against a contract nobody is asking for. The
thresholds themselves are derived from `utils/score_parser.py` rather than
restated, and `tests/test_eval_score.py` covers the rest. The gate tables sit apart
in `gates.py`, so the evaluators stay pure reporters — `tests/test_eval_gates.py`
covers those.

Every experiment records `score_prompt_sha` in its metadata, so a metric that
moved can be attributed to the model or to the prompt.

## Why this is not under `tests/`

`langraph/tests/conftest.py` replaces the model modules with `MagicMock`s at
import time. Anything pytest collected alongside it would score a mock and report
a perfect result, so nothing here is named `test_*.py` and the harness runs only
through `python -m langraph.evals.cli`. The evaluators' own unit tests live in
`langraph/tests/` and import pure functions only.
