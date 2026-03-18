## Introduction

A website that helps outdoor enthusiasts quickly find the best places to go by ranking locations based on weather, tide, and sea conditions tailored to specific activities like SUP, kayaking, snorkeling, and cycling.

## Local Development
- On Windows 11, install [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install).
- Install [Docker Desktop](https://docs.docker.com/get-started/introduction/get-docker-desktop/).
- Clone the Git repo. On Windows, do this within WSL2.
- Create `.env` based on `.env.example`.
- `make dev` to start http://localhost:3000
  - `make db-migrate` to initialise Postgres database.
  - `make db-seed` to seed the Postgres database with mock data.
  - `make db-studio` to open Drizzle Studio database explorer.
- If you prefer Kubernetes, `make k8s-dev` to start http://localhost:30000
  - `make k8s-db` to port-forward K8s database to localhost:5432 for `make db-*`

## Testing

- `npm test` to run all unit tests.
- `npm run test:coverage` to generate test coverage in the `coverage` folder.
- `npm run test:e2e` to run all Playwright integration tests.

## Deployment

- An example `terraform/main.tf` is provided for provisioning a single-node DigitalOcean Kubernetes cluster and Cloudflare.
- Follow `k8s/production/seal-secrets.sh` to generate a public/private key pair in the Kubernetes cluster and use it to seal secrets.
- Run `make k8s-prod` to deploy the PostgreSQL database, Nginx, Next.js app, and a cron job for collecting weather forecasts.
- Run `make k8s-db` to port-forward the Kubernetes database to `localhost:5432`, allowing you to run `make db-migrate` and `make db-studio`.
- Run `make k8s-forecast-login` to log in to your Claude Code subscription, enabling AI-powered weather forecast collection and analysis.
- Run `make k8s-prod-stop` to tear down the production Kubernetes deployments.

## Coding Standards

- Linting:
  - Good practices recommended by [ESLint](https://eslint.org/).
  - Keep format between developers, so we don't change Git history for no reason.
  - Enable Auto Fix for ESLint in editor.
    e.g. In Visual Studio Code:
    ```
    {
      "eslint.format.enable": true,
      "eslint.codeAction.showDocumentation": {
        "enable": true
      },
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
      }
    }
    ```
- Unit testing:
  - At least 100% coverage.
  - Useful, high-quality test cases for state management and utilities.
  - Component test cases can be difficult or fragile, so coverage alone is sufficient. Other types of testing higher in the testing pyramid, such as visual regression testing, are often more effective.
  - Maintain a balance between usefulness and maintainability in test cases.
  - The Git pre-push hook requires all linting and unit tests to pass.
- Code Review:
  - Every pull request should be releasable. Use feature toggles if necessary.
  - Rebase the feature branch from `develop` before creating a pull request. Do not merge `develop` into the feature branch.
  - Ideally, rebase into meaningful commits.
  - Organise each pull request into bite-sized changes.
  - Provide proof of testing with screenshots or videos.
  - Add notes in the pull request about interesting points for discussion.
- Convention:
  - Leverage [Agentic Development Workflow](https://github.com/Intai/story-flow).
  - Our file names use hyphenated lowercase.
  - Our variables and functions use camelCase.
  - Our components and classes use PascalCase.
  - Naming is challenging but important for readability.
  - Functions should follow the single-responsibility principle for readability and maintainability.
  - Performance only needs to meet business requirements, ideally without sacrificing readability or maintainability too much.
  - Functional programming is useful for readability and for capturing common patterns.
  - Do not mutate outside the scope of a function.
  - Testability at all levels of the testing pyramid is important and not optional.
  - Keep small business logic inside React components if it doesn't need to be shared for simplicity.
  - Shared or larger business logic should preferably reside in state management for testability and maintainability.
  - Share useful shortcuts and configurations in the `scripts` folder for development.
