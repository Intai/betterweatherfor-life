As an outdoor enthusiast, I want the location detail page to name the activity its forecast is tailored to, so that I can tell whether the conditions shown are for SUP, kayaking, snorkelling, or cycling.

## Requirements

- The "Conditions" section heading names the currently selected activity, e.g. "Conditions for SUP".
- The score card's best-conditions line is unchanged — it still reads "Best conditions at 08:00" (or "Better conditions at 08:00" for the marginal/unsuitable variant) with no activity name.
- The activity name reuses the existing localized labels under `home.activities` (SUP, Kayaking, Snorkelling, Cycling) — no new copy for activity names.
- The Conditions heading reflects whichever activity is selected in the forecast store and updates when the selection changes.
- Behaviour is consistent across all four activities.

## Tasks

**Parallel tasks 1-4:**

1. Use frontend-developer subagent to add an `{{activity}}` interpolation to the `locationDetail.conditions` key in @app/locales/en/translation.json: `conditions` → "Conditions for {{activity}}". Leave `bestAt` and `betterAt` unchanged.
2. Use frontend-developer subagent to read the selected activity in the parent and pass it down @app/(app)/components/location-detail.jsx. Destructure `selectedActivity` from the existing `useForecastStore()` call and pass `activity={selectedActivity}` as a prop to `<LocationDetailConditions>`.
3. Use frontend-developer subagent to name the activity in the section heading @app/(app)/components/location-detail-conditions.jsx. Accept the new `activity` prop and pass `{ activity: t(\`home.activities.${activity}\`) }` into `t('locationDetail.conditions')`. Update the JSDoc to document the new prop.
4. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/location-detail-activity.feature covering: each of the four activities showing its name in the "Conditions" heading, and the heading updating when the selected activity changes.

**Sequential task 5 after tasks 1-4 complete:**

5. Use qa-tester subagent to verify the implementation meets the acceptance criteria by executing all BDD scenarios @app/(app)/docs/location-detail-activity.feature via the /execute-scenario command. If any scenario fails, fix the implementation with the frontend-developer subagent and re-run until every scenario passes.
