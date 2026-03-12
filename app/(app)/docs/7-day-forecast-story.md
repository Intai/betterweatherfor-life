As a user, I want to see a rolling 7-day forecast showing the best location recommendation for each day based on my selected activity, so I can plan outdoor activities ahead of time.

## Requirements

- Display a rolling 7-day forecast (today + next 6 days) with one recommendation card per day.
- Each day card shows the best-scoring location from the user's saved locations for the selected activity, using the `all-day` time range.
- Each day card displays: short date heading (e.g. "Sat 1 Feb"), best location name, score circle (w-14 h-14 consistently), condition badge (Ideal/Acceptable/Marginal/Unsuitable), best time window, and a brief AI summary.
- Show a "Best Day" badge on the day with the highest score across the 7 days.
- Unsuitable day cards show a simplified display with no location recommendation and "No recommended window" text.
- Activity selector at the top switches the activity and updates all daily recommendations.
- Day selector strip shows horizontal scrollable day buttons with day abbreviation, date number, and mini score badge. Tapping a day smooth-scrolls to that day's card. Hidden in phone landscape only; visible in all other layouts (phone portrait, tablet, desktop).
- Tapping a day card navigates to the Home screen with the time picker set to that day, so the user sees the full ranked list for that day.
- Best time window is derived from hourly data using a peak cluster algorithm: find the best hour, then extend outward while scores stay within a threshold.
- Empty state when no locations are saved shows a calendar icon, message, and "Go to Home" button.
- Phone portrait layout: cards stack vertically with day selector strip.
- Phone landscape layout: cards scroll horizontally in a single row with no day selector strip.
- Tablet and desktop layouts: day selector strip visible, with cards in grid or horizontal scroll as shown in UI design.
- Responsive layouts for tablet and desktop as shown in UI design.
- Two routes: `/forecast` (client-side, uses localStorage locations) and `/[city]/forecast` (server-side rendered with `getForecastsByCity`).
- All user-facing text uses i18next translation keys.

## Tasks

**Parallel tasks 1-6:**

1. Use frontend-developer subagent to add `findBestWindow(hourly)` utility @app/utils/forecast.js. Implement peak cluster algorithm: find the best hour via existing `findBestHour`, then extend outward while scores stay within ~20 points of peak. Return `{ start, end }` (e.g. `{ start: '07:00', end: '11:00' }`) or null if no acceptable hours.
2. Use frontend-developer subagent to add 7-day forecast selectors @app/(app)/stores/forecast-selectors.js. Add `buildSevenDayForecastEntries(activity, forecast)` that filters forecast entries matching `activity;*;all-day;*` key pattern, groups by date segment, picks the highest-scoring entry per date, marks the highest-scoring entry with `isBestDay: true`, and returns `[[forecastKey, entry]]` (same shape as `buildForecastEntries`). Add `useSevenDayForecastEntries` hook. Reuse existing `buildForecastEntries` pattern and `sortByScore`.
3. Use frontend-developer subagent to add i18n translation keys for the 7-day forecast page @app/locales/en/translation.json. Add `forecast` namespace with keys for: `title`, `bestDay`, `bestSpot`, `bestWindow`, `noWindow`, `empty.title`, `empty.subtitle`, `empty.goHome`, `today` label.
4. Use frontend-developer subagent to create the `ForecastDaySelectorStrip` component @app/(app)/components/forecast-day-selector-strip.jsx. Horizontal scrollable strip of day buttons showing day abbreviation, date number, and mini score badge color-coded by condition. Tapping a day calls a scroll callback. Use `formatShortDate` and condition color utilities. Hidden in phone landscape only; visible in all other layouts. Reference @app/docs/7-day-forecast-ui-design.html.
5. Use backend-developer subagent to extend seed data @db/seed.js to generate 7 days of forecasts per location. Use existing location entries as Day 1 templates. Programmatically generate today + next 6 days by applying score offsets and rotating conditions per day — ensure at least one unsuitable day and a clear "Best Day" winner per activity. Vary hourly data per day so `findBestWindow` returns different windows. Use `dateNow` and `addDays` from `@/app/utils/date` for date generation.
6. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/7-day-forecast.feature.

**Sequential task 7 after task 1 completes:**

7. Use frontend-developer subagent to create the `ForecastDayCard` component @app/(app)/components/forecast-day-card.jsx. Single responsive card used in all layouts (parent controls width — full-width in portrait stack, fixed-width in horizontal scroll, grid cell in grid). Shows: short date heading (e.g. "Sat 1 Feb") with optional "Today" chip and "Best Day" shimmer badge, best location name, w-14 h-14 score circle with solid background color (reuse `getConditionBackgroundColor` from `location-detail-score.jsx`), condition badge, best time window from `findBestWindow`, and AI summary in a themed rounded box (use `bg-secondary` and `text-muted-foreground` for normal days, matching the summary pattern in `location-detail-factor-card.jsx`). Unsuitable variant has no location name, "No recommended window" text, and summary box tinted by condition using the `color-mix` pattern from `location-detail-analysis.jsx`. Card is tappable and navigates to Home with that day selected. Reference @app/docs/7-day-forecast-ui-design.html for styling.

**Sequential task 8 after tasks 2, 4, 7 complete:**

8. Use frontend-developer subagent to create the `ForecastDayList` client component @app/(app)/components/forecast-day-list.jsx. Main content component that consumes the forecast store, computes day summaries via `buildSevenDayForecast(activity, forecast)`, identifies the best day, and renders `ForecastDaySelectorStrip` + `ForecastDayCard` in responsive layouts: vertical stack (phone portrait), horizontal scroll of fixed-width cards (phone landscape, no day selector strip), 2-col grid (tablet portrait `md`), horizontal scroll (tablet landscape `lg` landscape), 3-col grid (desktop `xl`). Uses `useRef` for scroll-to-card on day selector tap. Handles loading skeletons and empty state with "Go to Home" button (context-aware: `/home` or `/[city]/home` based on store's `citySlug`). Reuse `ActivitySelector` component. Follow the `LocationList` pattern from @app/(app)/components/location-list.jsx for store integration and loading states.

**Parallel after task 8 completes:**

9. Use frontend-developer subagent to implement the server-rendered city forecast page @app/(app)/[city]/forecast/page.js. Follow the pattern from @app/(app)/[city]/home/page.jsx: fetch forecasts via `getForecastsByCity(citySlug)`, read cookies via `pickPreferences`, build `initialState` with `isLoaded: true`, `citySlug`, and `forecast`, wrap `ForecastDayList` in `ForecastStoreProvider`. Keep existing `generateMetadata`.
10. Use frontend-developer subagent to implement the client-side forecast page @app/(app)/forecast/page.js. Follow the pattern from @app/(app)/home/page.jsx: wrap `ForecastDayList` in `ForecastStoreProvider` with no initialState. Client-side hydration via `initLocations()` loads from localStorage and fetches forecasts from `/api/forecasts`.
