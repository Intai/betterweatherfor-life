---
name: execute-bdd-scenario
description: Project overrides for executing BDD scenarios in betterweatherfor-life.
user-invocable: false
---

## Visual Regression (VRT)

Extends the plugin skill's VRT rules.

- Every `[RECORD_VISUAL]` annotation MUST carry runtime-derived `ignoreAreas` from
  `app/(app)/docs/vrt-ignore-areas.js`. Never record hardcoded pixel numbers — they break on any
  layout change and are unreviewable in a diff.

  ```javascript
  ignoreAreas: await ignoreAreasOf(page, ['forecast-date'])
  ```

  `db/seed.js` dates forecasts relative to today, so any element rendering a forecast date changes
  daily and would invalidate its baseline overnight. Pass whichever volatile testids are present on
  the page under capture:

  | testid | Renders |
  |--------|---------|
  | `forecast-date` | Date and time window under the score circle on location detail |
  | `day-selector-strip` | Day tabs on the 7-day forecast page |
