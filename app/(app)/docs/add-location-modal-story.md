As an outdoor enthusiast, I want to search for and add new locations to my list so that I can track weather conditions at spots I care about.

## Requirements

- Tapping the + button in the location list header opens an Add Location modal.
- The modal is centred on tablet/desktop and bottom-anchored on mobile, with a semi-transparent backdrop. Match the design from @app/docs/home-ui-design.html and the wireframe in @app/docs/home-layout.md.
- The modal has an "Add Location" title, close button (x), and a search input field with a search icon placeholder "Search locations...".
- Typing in the search input triggers Google Places autocomplete after a 300ms debounce. Results appear as a scrollable list showing location name (bold) and area (muted) for each suggestion.
- The Google Maps JavaScript SDK is lazy-loaded via `@googlemaps/js-api-loader` when the modal first opens. A new `AutocompleteSessionToken` is created per modal open for billing optimization.
- Tapping a search result fetches place details from the SDK, persists the location to the server via `POST /api/locations`, saves it to localStorage, updates the store, and closes the modal.
- The `POST /api/locations` route accepts `{ name, area, citySlug, latitude, longitude }`, derives timezone from coordinates using `geo-tz`, upserts into the locations table (source: `'geocoded'`), and returns `{ name, area, latitude, longitude, timeZone }`.
- A `GET /api/forecasts` route accepts `?locations=lat,lng;lat,lng;...` and returns forecast data for matching locations in the same `{ [key]: entry }` map format the store uses.
- The user's saved locations are stored in localStorage. On page load, the store reads localStorage and fetches forecasts via `GET /api/forecasts`. Locations without forecast data render as Scheduled Location Cards.
- The Scheduled Location Card matches the design in @app/docs/home-ui-design.html and @app/docs/home-layout.md: dashed border, location name/area header, remove (x) button, cloud icon, "Forecast scheduled" heading, and description text. Scheduled cards appear after scored cards.
- Components never call APIs or localStorage directly — all side effects flow through store actions (`addLocation`, `removeLocation`, `initLocations`).
- Implement a reusable `debounce(fn, delay)` utility that handles both sync and async functions. For async, reject previous pending promises with a custom `DebounceAbortError`.
- Implement a generic `local-storage.js` utility for JSON localStorage access with error handling, and a `location-storage.js` module built on top of it.
- The Google Maps API key follows the existing config convention: `config/default.json` → `config/custom-environment-variables.json` → `next.config.mjs` env block. Client code accesses via `process.env.GOOGLE_MAPS_API_KEY`.
- All visible text is localised via i18next.

## Tasks

**Parallel tasks 1-5:**

1. Use backend-developer subagent to install `@googlemaps/js-api-loader` and `geo-tz` dependencies.
2. Use backend-developer subagent to add Google Maps API key config. Add `"googleMaps": { "apiKey": "" }` to @config/default.json, add `"googleMaps": { "apiKey": "GOOGLE_MAPS_API_KEY" }` to @config/custom-environment-variables.json, add `GOOGLE_MAPS_API_KEY: config.get('googleMaps.apiKey')` to the `env` block in @next.config.mjs, and add `GOOGLE_MAPS_API_KEY=` to @.env.example.
3. Use frontend-developer subagent to add shadcn Dialog component @shadcn/components/ui/dialog.jsx. Build on `radix-ui` Dialog primitive (already a transitive dependency via Sheet). Export `Dialog`, `DialogTrigger`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogClose`. Style `DialogContent` as centred on tablet/desktop (sm+) and bottom-anchored with rounded top corners on mobile. Match styling from @app/docs/home-ui-design.html.
4. Use frontend-developer subagent to add i18n translation keys @app/locales/en/translation.json. Add `home.locations.searchPlaceholder` ("Search locations..."), `home.locations.noResults` ("No results found"), `home.locations.searchError` ("Search failed. Please try again."), `home.locations.scheduled.title` ("Forecast scheduled"), `home.locations.scheduled.description` ("We've scheduled this location for forecast collection. Check back later — we'll have conditions ready for you.").
5. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/add-location-modal.feature.

**Sequential tasks 6-7:**

6. Use frontend-developer subagent to create custom errors @app/utils/errors.js. Export `DebounceAbortError` extending `Error` with `name: 'DebounceAbortError'`.
7. Use frontend-developer subagent to create debounce utility @app/utils/function.js. Export `debounce(fn, delay)` that works with both sync and async functions. For sync: standard debounce with timer reset. For async: return a promise per call, reject previous pending promise with `DebounceAbortError` when a new call supersedes it. Return a debounced function with a `.cancel()` method.

**Sequential tasks 8-9:**

8. Use frontend-developer subagent to create generic localStorage utility @app/utils/local-storage.js. Export `getItem(key, fallback)` that reads and parses JSON returning `fallback` if missing or corrupt, and `setItem(key, value)` that JSON.stringifies and writes.
9. Use frontend-developer subagent to create location storage utility @app/utils/location-storage.js. Built on `local-storage.js`. Import `buildLocationKey` `${latitude},${longitude}` from @app/utils/forecast. Export `getLocations()` (returns object, fallback `{}`), `addLocation({ name, area, latitude, longitude, timeZone })` (uses `assoc(key, value, locations)`), and `removeLocation(key)` (uses `dissoc(key, locations)`).

**Sequential task 10 after task 1 completes:**

10. Use frontend-developer subagent to create Google Places loader utility @app/utils/google-places.js. Wrap `@googlemaps/js-api-loader` to lazy-load the `places` library. Export `loadPlacesLibrary()` that returns `{ AutocompleteService, AutocompleteSessionToken }`, cached after first load. Read API key from `process.env.GOOGLE_MAPS_API_KEY`.

**Sequential tasks 11-12 after task 1 completes:**

11. Use backend-developer subagent to create `upsertLocation` query @db/queries/locations.js. Accept `{ name, area, citySlug, latitude, longitude, timeZone, source }`, insert into locations table using `onConflictDoUpdate` on the `(latitude, longitude)` unique index, return the upserted row.
12. Use backend-developer subagent to create `POST /api/locations` route @app/api/locations/route.js. Validate body `{ name, area, citySlug, latitude, longitude }`, derive timezone using `geo-tz` `find()`, call `upsertLocation()` with source `'geocoded'`, return `{ name, area, latitude, longitude, timeZone }`.

**Sequential tasks 13-14:**

13. Use backend-developer subagent to add `getForecastsByLocations(latLngPairs)` query @db/queries/forecasts.js. Accept an array of `[latitude, longitude]` pairs, join forecasts with locations, return forecast data in the same `{ [key]: entry }` map format used by `getForecastsByCity`.
14. Use backend-developer subagent to create `GET /api/forecasts` route @app/api/forecasts/route.js. Parse `locations` query param as semicolon-separated `lat,lng` pairs, call `getForecastsByLocations()`, return the forecast map. Locations with no forecast data are simply absent from the response.

**Sequential tasks 15-16 after task 9 completes:**

15. Use frontend-developer subagent to update forecast store @app/(app)/stores/forecast-store.js. Import `buildLocationKey` from @app/utils/forecast and `assoc` from Ramda. `addLocation`: after API response, use the API response directly as `loc`, save to localStorage, update state with `assoc(key, loc, state.locations || {})`. `removeLocation(key)`: call `deleteLocation(key)`, update state with `dissoc(key, state.locations || {})`. `initLocations`: `getLocations()` returns object; use `Object.keys(locations)` for the coordinate param (keys are already `"lat,lng"`), join with `';'`.
16. Use frontend-developer subagent to update forecast selectors @app/(app)/stores/forecast-selectors.js. Add `getScheduledLocationEntries` / `useScheduledLocationEntries` that reads `locations` and `forecast` from store and returns `[key, location]` pairs (locations without matching forecast entries), sorted by name ascending.

**Parallel after tasks 3, 7, 10, 15 complete:**

17. Use frontend-developer subagent to create ScheduledLocationCard component @app/(app)/components/scheduled-location-card.jsx. Match the design in @app/docs/home-ui-design.html and @app/docs/home-layout.md: dashed border (`border-dashed`), CardHeader with name and area, remove (x) button calling `removeLocation(locationKey)` from store. Receives `{ locationKey, name, area }` props. Use shadcn Card components and i18n for all text.
18. Use frontend-developer subagent to update city home page @app/(app)/[city]/home/page.jsx. Pass `citySlug: city` in `ForecastStoreProvider initialState`.
19. Use frontend-developer subagent to create AddLocationModal component @app/(app)/components/add-location-modal.jsx. Self-contained `'use client'` component rendering both the + button trigger and the Dialog. Local state: `open`, `inputValue`, `suggestions`, `isSearching`. On modal open: lazy-load Google Places via `loadPlacesLibrary()`, create new `AutocompleteSessionToken`. Debounce search input (300ms) using `debounce()` from `function.js`, catch `DebounceAbortError` silently. Call `AutocompleteService.getPlacePredictions()` with input + session token. Render results as bold `mainText` + muted `secondaryText`. On result tap: call `fetchFields` for place details, then `addLocation()` on store, then close modal. Read `citySlug` from forecast store. Match design from @app/docs/home-ui-design.html and @app/docs/home-layout.md.

**Parallel after tasks 16, 17, 19 complete:**

20. Use frontend-developer subagent to update LocationListHeader @app/(app)/components/location-list-header.jsx. Replace the standalone `<Button>` with `<AddLocationModal />` which renders the + button as its own trigger.
21. Use frontend-developer subagent to update LocationList @app/(app)/components/location-list.jsx. Call `initLocations()` from store in a `useEffect` on mount. Use `useScheduledLocationEntries()` selector and render `ScheduledLocationCard` for each `[key, location]` entry, passing `key` as React key and `locationKey` prop.
