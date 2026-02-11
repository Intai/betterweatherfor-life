As an outdoor enthusiast visiting a city page, I want to see ranked locations with weather conditions for my selected activity and time window so that I can quickly find the best spots to go.

## Requirements

- Update the forecast store to include a `forecast` object in defaultState that stores forecast data keyed by compound strings in the format `activity;date;timeRange;lat,lng` (e.g. `sup;2026-02-11;all-day;-36.8547,174.8317`). Each value holds `{ name, area, score, condition, wind: { speed, direction }, tide: { state, percentage }, water, temp, summary }`.
- Render ActivitySelector and TimeWindowPicker on the city home page, wrapped in ForecastStoreProvider with mock initialState, matching the global home page composition at @app/(app)/home/page.jsx.
- Mock the initialState in the city home page with a `forecast` object containing 3 Auckland locations (Mission Bay score 85 Ideal, Takapuna Beach score 62 Acceptable, St Heliers Bay score 58 Marginal) matching the data shown in @app/docs/home-ui-design.html and @app/docs/home-layout.md.
- Render a list header with "Locations" title left-aligned and a plus (+) button right-aligned with outline style. The plus button is a placeholder with no action — add-location functionality will be implemented in a future story.
- Render a LocationCard for each forecast entry matching the selected activity, date, and time range. Each card shows: location name and area, remove button (x), score bar (width proportional to score, color matching condition), score label and condition badge pill, 2x2 conditions grid (Wind, Tide, Water, Temperature with icons), and AI summary text. Match styling from @app/docs/home-ui-design.html.
- Score bar and condition badge colors: Ideal (80-100) green, Acceptable (60-79) sky/blue, Marginal (40-59) orange, Unsuitable (0-39) red.
- Sort location cards by score descending.
- Show empty state when no locations match: centered card with pin icon, "No locations yet" heading, "Tap + to add your first spot" subtitle.
- All visible text is localised via i18next.

## Tasks

**Parallel tasks 1-6:**

1. Use frontend-developer subagent to add `formatISODate` utility @app/utils/date.js. Add a function that takes a `Date` and returns a `yyyy-MM-dd` string using `date-fns` `format`. Add a `formatForecastDate` function that takes `(selectedDay, selectedDate)` and returns a `yyyy-MM-dd` string: `'today'` → today's date, `'tomorrow'` → tomorrow's date (via `addDays`), `'pick-date'` → `formatISODate(selectedDate)`.
2. Use frontend-developer subagent to update forecast store @app/(app)/stores/forecast-store.js. Add `forecast: {}` to defaultState. Add a `removeForecast(key)` action that removes the entry at the given compound key from the forecast object.
3. Use frontend-developer subagent to add i18n translation keys @app/locales/en/translation.json. Add `home.locations.title` ("Locations"), `home.locations.addLocation` ("Add location"), `home.locations.empty.title` ("No locations yet"), `home.locations.empty.subtitle` ("Tap + to add your first spot"), `home.conditions.ideal` ("Ideal"), `home.conditions.acceptable` ("Acceptable"), `home.conditions.marginal` ("Marginal"), `home.conditions.unsuitable` ("Unsuitable"), `home.conditions.wind` ("Wind"), `home.conditions.tide` ("Tide"), `home.conditions.water` ("Water"), `home.conditions.temp` ("Temp").
4. Use frontend-developer subagent to create LocationListHeader component @app/(app)/components/location-list-header.jsx. Render flex row with "Locations" heading (text-lg font-semibold) and plus button (shadcn Button variant outline, rounded-full, Plus icon from Lucide). Use i18n for heading and button aria-label.
5. Use frontend-developer subagent to create LocationListEmpty component @app/(app)/components/location-list-empty.jsx. Render centered content with MapPin icon from Lucide, "No locations yet" heading, "Tap + to add your first spot" subtitle. Use i18n for text.
6. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/home-locations.feature.

**Sequential task 7 after task 2 completes:**

7. Use frontend-developer subagent to create LocationCard component @app/(app)/components/location-card.jsx. Accept props `{ forecastKey, name, area, score, condition, wind, tide, water, temp, summary }`. The remove button calls `removeForecast(forecastKey)` via `useForecastStore` directly — no onRemove callback prop. Render card with: header (name h3 + area subtitle + x remove button), score bar (h-2 rounded-full, fill width = score%, fill color by condition), score label + condition badge pill, 2x2 conditions grid with icons (wind arrow, tide chevron SVG with fill level, water droplet, temperature thermometer SVG with fill level), and AI summary in muted background. Match styling from @app/docs/home-ui-design.html location card section. Use i18n for condition labels and grid labels.

**Sequential tasks 8-9 after tasks 1, 4, 5, 7 complete:**

8. Use frontend-developer subagent to create LocationList component @app/(app)/components/location-list.jsx. Read forecast, selectedActivity, selectedDay, selectedDate, and selectedTimeRange from `useForecastStore`. Use `formatForecastDate(selectedDay, selectedDate)` from @app/utils/date.js to get the date string for key matching. Filter forecast keys matching the selected activity/date/timeRange, sort entries by score descending, and render a LocationCard for each. Render LocationListHeader above the list. Show LocationListEmpty when no entries match.
9. Use frontend-developer subagent to implement city home page @app/(app)/[city]/home/page.js. Define mock initialState with forecast object containing 3 entries keyed as `sup;2026-02-11;all-day;{lat},{lng}` for Mission Bay (-36.8547,174.8317 score 85), Takapuna Beach (-36.7878,174.7768 score 62), St Heliers Bay (-36.8508,174.8593 score 58). Compose: ForecastStoreProvider wrapping ActivitySelector, TimeWindowPicker, and LocationList.
