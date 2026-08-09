A website that helps outdoor enthusiasts quickly find the best places to go by ranking locations based on weather, tide, and sea conditions tailored to specific activities like SUP, kayaking, snorkeling, and cycling.

## Tech Stack

### Web

- `ESLint` for code linting and formatting.
- `Next.js`, `React`, `shadcn/ui`, `Tailwind CSS`, `Zustand` for UI development.
- `Ramda` for functional programming.
- `RxJS` for interactive functional programming.
- `i18next` for localisation.
- `date-fns` and `date-fns-tz` for date time manipulation.
- `Jest`, `React Testing Library` and `RxJS Marbles` for unit testing and coverage.

### DevOps

- `Docker compose` for containerisation.

### QA

- `Playwright` for browser manipulation.

## Local Development

- `make dev` to start development environment on port 3000.
- `make dev-bg` to start development environment in background.
- `make dev-stop` to stop development environment.
- `make prod` to start production environment.
- `make prod-bg` to start production environment in background.
- `make prod-stop` to stop production environment.
- `make vrt-bg` to start visual regression tracker on port 8080 in background.
- `make vrt-stop` to stop visual regression tracker.
- `make vrt-creds` to show the seeded visual regression tracker credentials.

### Testing

- `npm run lint` to lint all files.
  - `npm run lint -- "path/to/file.js*"` to lint a specific file.
- `npm test -- --silent` to run all unit tests.
  - `npm test -- --runTestsByPath "path/to/file.spec.js*" --testNamePattern="matching string" --silent` to run specific unit tests in a spec file.
- `npm run test:e2e` to run all Playwright tests.
  - `npm run test:e2e -- --grep "matching string"` to run specific Playwright tests.
- `npm run test:vr` to run visual regression tests against the tracker on port 8080.
  - `npm run test:vr -- --grep "(?=.*@screenshots)(?=.*matching string)" "file.spec.js"` to run specific visual regression tests.
- `.venv/bin/ruff check langraph` to lint all Python files.
  - `.venv/bin/ruff check "langraph/path/to/file.py"` to lint a specific file.
- `.venv/bin/pytest langraph/tests/ --cov --cov-config=langraph/pyproject.toml --cov-report=term-missing` to run all LangGraph unit tests with coverage.
  - `.venv/bin/pytest "langraph/tests/test_file.py" -k "matching_string"` to run specific LangGraph unit tests in a test file.
  - Drop the `.venv/bin/` prefix when the venv is already activated.

### LangSmith evaluations

Not part of `make test` — they spend real tokens and hit the network.

- `make langraph-seeds` to list the captured fetch seeds.
- `make langraph-capture EVAL_ARGS="--slug ... --lat ... --lng ... --date ... --timezone ..."` to record a fetch phase into a seed.
- `make langraph-push` to upsert the seeds into the LangSmith datasets.
- `make langraph-fetch EVAL_ARGS="--source tides"` to evaluate one fetch node.
- `make langraph-score EVAL_ARGS="--activity sup --limit 1"` to evaluate the scorers against frozen fetch data.
- `make langraph-e2e` to evaluate the whole graph end to end.
- Add `--models xai=low,gemini=medium` to either `langraph-fetch` or `langraph-score` to run one experiment per model and compare them side by side. A spec is `provider:model=effort`; effort uses `=` because model names contain colons.
- Add `--judge` to `langraph-score` to also run the LLM judges, roughly doubling the cost. It takes an optional spec in the same form naming the examiner, e.g. `--judge claude-cli:opus=medium`. The judges grade a fixed 3 entries each by default, not the whole forecast. `--judge-sample N` widens both, at a cost that scales with N.
- Add `--gate` to make an experiment exit non-zero on an unusable run, a contract violation, or a regression below a calibrated floor. It is a switch, not a threshold — every criterion lives in `langraph/evals/gates.py`. Omit it when sweeping `--models`, since the floors describe one model.

## Convention

- Our own file names are in hyphenated lower case.
- Implement in JavaScript instead of TypeScript.
- Name test files with `*.spec.js*`.
- Write JSDoc for exported functions in utils, store actions/selectors, and db queries.
