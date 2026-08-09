"""The entry point for every experiment.

Import order matters here rather than being a matter of taste: `models/*.py`
build their singletons at import time and read their API keys while doing so, so
`setup_environment()` has to run before anything under `langraph.models` is
imported. Every command below therefore imports the harness inside its own
function, the same deferred-import pattern `app/update_forecasts.py` uses.
"""

import argparse
import sys

from langraph.evals.config import (
    ACTIVITIES,
    FETCH_SOURCES,
    GRAPH_DATASET,
    SCORE_DATASET,
    STATE_INPUTS,
    experiment_metadata,
    fetch_dataset,
    setup_environment,
)

# Above this many model calls the CLI stops and asks, because a sweep of every
# seed against every activity is easy to type and expensive to run.
CONFIRM_ABOVE = 20


def _parse_spec(spec):
    """Read a `provider:model=effort` sweep spec, any part of which may be omitted.

    Effort is separated by `=` rather than a third colon because model names
    carry colons of their own — this project's own OpenRouter default is
    `nvidia/nemotron-3-ultra-550b-a55b:free`, and splitting that on colons drops
    the `:free` suffix and reads it as the effort, which would quietly evaluate
    the paid model with a nonsense reasoning effort. `=` cannot appear in a model
    name, so the split is unambiguous.

    Args:
        spec: e.g. `xai`, `gemini=medium`, `openrouter:some/model:free=low`.

    Returns:
        A `(provider, model, effort)` triple, each None when not given.
    """
    head, _, effort = spec.partition("=")
    provider, _, model = head.partition(":")
    return (provider.strip() or None, model.strip() or None, effort.strip() or None)


def _model_specs(values):
    """Read every `--models` value, splitting each on commas.

    So a whole sweep can arrive as one flag as well as several — which keeps the
    Makefile from having to split the list itself, something GNU Make can only do
    via a literal-comma variable because `subst` is comma-delimited too.
    """
    return [
        spec.strip()
        for value in values or []
        for spec in value.split(",")
        if spec.strip()
    ]


def _each_model(specs, build):
    """Yield one built model per spec, with the label its experiment is named for.

    Each is built once here and handed to the target, never re-read from the
    environment mid-run: a sweep that did that would measure one model and label
    the results with another. A `None` spec means run on whatever the environment
    already names, and yields no model at all so the singleton stands.

    Args:
        specs: `provider:model:effort` strings, or `[None]` for a single default run.
        build: `build_score_llm` or `build_fetch_llm`.

    Yields:
        A `(llm, label, (provider, model, effort))` triple per spec.
    """
    for spec in specs:
        provider, model, effort = _parse_spec(spec) if spec else (None, None, None)
        llm = build(provider, model, effort) if spec else None
        label = "-".join(part for part in (provider, model, effort) if part) or "default"
        yield llm, label.replace("/", "-"), (provider, model, effort)


def _sample_size(value):
    """Read a judge sample size, rejecting the ones `_sample` cannot divide by.

    `_sample` computes `len(entries) // count`, so a zero would raise mid-run —
    after the models under test had already been paid for.
    """
    size = int(value)
    if size < 1:
        raise argparse.ArgumentTypeError("must be 1 or more")
    return size


def _confirm(calls, assume_yes):
    """Stop before an expensive run unless it was asked for explicitly."""
    if calls <= CONFIRM_ABOVE or assume_yes:
        return True
    answer = input(f"About to make ~{calls} model calls. Continue? [y/N] ")
    return answer.strip().lower() in ("y", "yes")


def _examples(client, dataset, limit, splits=None):
    """Take the examples an experiment will run over, so it can be counted first."""
    return list(client.list_examples(
        dataset_name=dataset, splits=splits, limit=limit
    ))


def _gate(args, results, label=None):
    """Apply the gate to one experiment, or nothing if `--gate` was not asked for.

    Deferred imports to match the rest of the file, though `gates.py` needs no key
    of its own: it reaches only the summary evaluator, so an ungated run simply
    never loads it.

    Args:
        args: The parsed arguments, read for `--gate`.
        results: What `evaluate()` returned.
        label: The sweep label, so a failing column can be told from a passing one.

    Returns:
        True when the experiment failed the gate.
    """
    if not args.gate:
        return False

    from langraph.evals.config import score_prompt_sha
    from langraph.evals.gates import gate

    print(f"Gate for {label}:" if label else "Gate:")
    return gate(results, prompt_sha=score_prompt_sha())


def command_capture(args):
    """Fetch a location's sources for real and write them into a committed seed."""
    from langraph.evals.capture import capture_from_run, capture_seed, load_existing
    from langraph.evals.seeds import write_seed

    if args.from_run:
        seed = capture_from_run(args.from_run, sources=args.source or FETCH_SOURCES)
    else:
        inputs = {
            "latitude": args.lat, "longitude": args.lng, "date": args.date,
            "timezone": args.timezone, "location_slug": args.slug,
        }
        missing = [key for key in STATE_INPUTS if not inputs.get(key)]
        if missing:
            raise SystemExit(f"capture needs {', '.join(missing)}")
        print(f"Capturing {args.slug} for {args.date}:")
        seed = capture_seed(
            inputs,
            sources=args.source or FETCH_SOURCES,
            existing=load_existing(args.slug, args.date),
        )

    path = write_seed(seed)
    print(f"Wrote {path} — review it before committing.")


def command_push(args):
    """Upsert the committed seeds into the datasets they feed."""
    from langraph.evals.datasets import push

    print("Pushing seeds:")
    push(which=args.dataset, slug=args.slug)


def command_list(args):
    """Show what has been captured, without touching LangSmith."""
    from langraph.evals.seeds import describe, load_seeds

    seeds = load_seeds(args.slug)
    if not seeds:
        print("No seeds captured yet.")
        return
    for seed in seeds:
        print(f"  {describe(seed)}")


def command_fetch(args):
    """Evaluate one fetch node in isolation, optionally sweeping models.

    A fetch source is a ReAct agent whose model choice matters as much as a
    scorer's, so it sweeps the same way — `models/fetch_llm.py` records by hand
    that haiku downsampled the marine hours and returned unparseable JSON.
    """
    from langsmith import Client, evaluate

    from langraph.evals.evaluators.suites import fetch_evaluators
    from langraph.evals.evaluators.summaries import FETCH_SUMMARIES
    from langraph.evals.targets import fetch_target
    from langraph.models.fetch_llm import build_fetch_llm

    client = Client()
    examples = _examples(client, fetch_dataset(args.source), args.limit)
    specs = _model_specs(args.models) or [None]

    if not _confirm(len(examples) * args.repetitions * len(specs), args.yes):
        return

    failed = False
    for llm, label, (provider, model, effort) in _each_model(specs, build_fetch_llm):
        results = evaluate(
            fetch_target(args.source, llm=llm),
            data=examples,
            evaluators=fetch_evaluators(args.source),
            summary_evaluators=list(FETCH_SUMMARIES),
            experiment_prefix=f"fetch-{args.source}-{label}",
            metadata=experiment_metadata(provider, model, effort,
                                         source=args.source),
            num_repetitions=args.repetitions,
            max_concurrency=args.concurrency,
            client=client,
        )
        failed |= _gate(args, results, label)

    return 1 if failed else None


def command_score(args):
    """Evaluate the scorers against frozen fetch data, optionally sweeping models."""
    from langsmith import Client, evaluate

    from langraph.evals.evaluators.suites import score_evaluators
    from langraph.evals.evaluators.summaries import SCORE_SUMMARIES
    from langraph.evals.targets import score_target
    from langraph.models.score_llm import build_score_llm

    client = Client()
    splits = [args.activity] if args.activity else None
    examples = _examples(client, SCORE_DATASET, args.limit, splits=splits)

    # No `--models` means one run on whatever the environment already names, so
    # the loop below still has exactly one pass to make.
    specs = _model_specs(args.models) or [None]

    if not _confirm(len(examples) * args.repetitions * len(specs), args.yes):
        return

    evaluators = score_evaluators()
    judge_label, judge_sample = "none", "none"
    if args.judge is not None:
        from langraph.evals.evaluators.judges import (
            JUDGE_SAMPLE,
            build_judge,
            judge_spec,
            make_analysis_quality_judge,
            make_score_plausibility_judge,
        )
        # One judge shared by both, rather than letting each factory build its
        # own: they grade with the same model, so two would be two clients doing
        # identical work. Built here rather than above, so aborting at the
        # confirmation costs nothing.
        #
        # `_parse_spec("")` is already three Nones, so the bare flag and a
        # partial spec take the same path.
        spec = judge_spec(*_parse_spec(args.judge))
        judge_label = "-".join(spec)
        judge = build_judge(*spec)
        judge_sample = args.judge_sample or JUDGE_SAMPLE
        judge_sample_args = {"sample": args.judge_sample} if args.judge_sample else {}
        evaluators += [
            make_score_plausibility_judge(judge, **judge_sample_args),
            make_analysis_quality_judge(judge, **judge_sample_args),
        ]

    # Every experiment is gated, not just up to the first failure: a sweep that
    # stopped early would leave the later models' columns unreported.
    failed = False
    for llm, label, (provider, model, effort) in _each_model(specs, build_score_llm):
        results = evaluate(
            score_target(activity=args.activity, llm=llm),
            data=examples,
            evaluators=evaluators,
            summary_evaluators=list(SCORE_SUMMARIES),
            experiment_prefix=f"score-{label}",
            metadata=experiment_metadata(provider, model, effort,
                                         activity=args.activity or "all",
                                         judge=judge_label,
                                         judge_sample=judge_sample),
            num_repetitions=args.repetitions,
            max_concurrency=args.concurrency,
            client=client,
        )
        failed |= _gate(args, results, label)

    return 1 if failed else None


def command_e2e(args):
    """Evaluate the whole graph end to end against live data."""
    from langsmith import Client, evaluate

    from langraph.evals.evaluators.suites import graph_evaluators
    from langraph.evals.evaluators.summaries import FETCH_SUMMARIES
    from langraph.evals.targets import graph_target

    client = Client()
    examples = _examples(client, GRAPH_DATASET, args.limit)
    # Nine model calls a run, against data that drifts daily — an integration
    # check, never a model comparison.
    if not _confirm(len(examples) * args.repetitions * len(FETCH_SOURCES), args.yes):
        return

    results = evaluate(
        graph_target(max_concurrency=args.concurrency),
        data=examples,
        evaluators=graph_evaluators(ACTIVITIES),
        summary_evaluators=list(FETCH_SUMMARIES),
        experiment_prefix="graph",
        metadata=experiment_metadata(),
        num_repetitions=args.repetitions,
        # One at a time: the graph fans out internally already, and the score
        # nodes share `FORECAST_OUTPUT_DIR`.
        max_concurrency=1,
        client=client,
    )

    # A thin gate by design: `graph_evaluators` reports a fraction of the keys the
    # per-node suites do, so most of the tables go unmeasured here.
    return 1 if _gate(args, results) else None


def _add_run_arguments(parser, concurrency=2, models=True):
    """Add the arguments every experiment takes.

    `models` is off only for the end-to-end suite, which is an integration check
    against live data: sweeping there would pay for the fetch phase once per
    model and let the drifting weather confound the comparison anyway.
    """
    parser.add_argument("--limit", type=int, help="Examples to run, newest first")
    parser.add_argument("--repetitions", type=int, default=1,
                        help="Runs per example; 3 or more for anything actionable")
    parser.add_argument("--concurrency", type=int, default=concurrency,
                        help="Examples in flight at once")
    parser.add_argument("--yes", action="store_true",
                        help="Skip the confirmation on an expensive run")
    parser.add_argument("--gate", action="store_true",
                        help="Exit non-zero on an unusable run, a contract "
                             "violation, or a regression below the floors in "
                             "gates.py. Omit it when sweeping models")
    if models:
        parser.add_argument("--models", action="append",
                            help="provider:model=effort specs, comma separated or "
                                 "repeated, e.g. xai=low,gemini=medium. One "
                                 "experiment each, compared side by side")


def build_parser():
    """Build the argument parser for every eval command."""
    parser = argparse.ArgumentParser(
        prog="python -m langraph.evals.cli",
        description="LangSmith evaluations for the forecast graph",
    )
    commands = parser.add_subparsers(dest="command", required=True)

    capture = commands.add_parser("capture", help="Record a fetch phase into a seed")
    capture.add_argument("--lat", help="Latitude")
    capture.add_argument("--lng", help="Longitude")
    capture.add_argument("--date", help="ISO date the forecast starts from")
    capture.add_argument("--timezone", help="IANA timezone")
    capture.add_argument("--slug", help="Location slug")
    capture.add_argument("--source", action="append", choices=FETCH_SOURCES,
                         help="Capture only these sources into an existing seed")
    capture.add_argument("--from-run", help="Recover a seed from a past traced run")
    capture.set_defaults(handler=command_capture)

    push = commands.add_parser("push", help="Upsert seeds into the LangSmith datasets")
    push.add_argument("--dataset", default="all",
                      choices=["score", "fetch", "source", "graph", "all"])
    push.add_argument("--slug", help="Push only one location's seeds")
    push.set_defaults(handler=command_push)

    listing = commands.add_parser("list", help="Show the committed seeds")
    listing.add_argument("--slug", help="Show only one location's seeds")
    listing.set_defaults(handler=command_list)

    fetch = commands.add_parser("fetch", help="Evaluate one fetch node")
    fetch.add_argument("--source", required=True, choices=FETCH_SOURCES)
    _add_run_arguments(fetch)
    fetch.set_defaults(handler=command_fetch)

    score = commands.add_parser("score", help="Evaluate the scorers on frozen data")
    score.add_argument("--activity", choices=ACTIVITIES,
                       help="Score one activity rather than all four")
    score.add_argument("--judge", nargs="?", const="", default=None,
                       metavar="SPEC",
                       help="Also run the LLM judges, roughly doubling the "
                            "cost. Optionally a provider:model=effort spec "
                            "naming the examiner, e.g. claude-cli:opus=medium")
    # Widening sample is not simply better, because the stride can alias. Entries sort
    # into a repeating cycle of four windows, so any `count` whose `len // count` is a
    # multiple of four lands on the same window every time: `--judge-sample 8` over 39
    # entries strides by 4 and spends six of its eight calls on `all-day`, never
    # reading a morning or an evening. 3 (stride 13) and 5 (stride 7) stay varied.
    score.add_argument("--judge-sample", type=_sample_size, metavar="N",
                       help="Entries each judge grades, 3 by default. Cost "
                            "scales with it. Does nothing without --judge")
    _add_run_arguments(score)
    score.set_defaults(handler=command_score)

    e2e = commands.add_parser("e2e", help="Evaluate the whole graph end to end")
    _add_run_arguments(e2e, models=False)
    e2e.set_defaults(handler=command_e2e)

    return parser


def main(argv=None):
    """Load the environment, then run one command.

    Returns the process exit code, so a gated experiment can fail. Handlers that
    have nothing to report return None, which `sys.exit` reads as success.
    """
    setup_environment()
    args = build_parser().parse_args(argv)
    return args.handler(args)


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main())
