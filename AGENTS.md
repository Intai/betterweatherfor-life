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
- `make prod-stop` to stop production environment.

### Testing

- `npm run lint` to lint all files.
  - `npm run lint -- "path/to/file.js*"` to lint a specific file.
- `npm test -- --silent` to run all unit tests.
  - `npm test -- "path/to/file.test.js*" --testNamePattern="matching string" --silent` to run specific unit tests in a spec file.

## Convention

- Have design files next to relevant source code structurally.
  - Use markdown files for product and UX design. Do not include code blocks in product design.
  - Use static HTML files for UML diagrams.
  - Use markdown files for UI layout design in ASCII wireframe format.
  - Use static HTML files for UI design. Use `mcp__chrome-devtools__navigate_page` and `mcp__chrome-devtools__take_screenshot` to take screenshots from one iteration to be fed into the next to improve. Ask for human feedback after each iteration.
- Our own file names are in hyphenated lower case.
- Implement in JavaScript instead of TypeScript.
