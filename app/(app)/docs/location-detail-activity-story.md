As an outdoor enthusiast, I want the location detail page to name the activity its forecast is tailored to, so that I can tell whether the conditions shown are for SUP, kayaking, snorkelling, or cycling.

## Requirements

- The score card's best-conditions line names the currently selected activity, e.g. "Best conditions for SUP at 08:00".
- The marginal/unsuitable variant of that line does the same, e.g. "Better conditions for SUP at 08:00".
- The "Conditions" section heading names the currently selected activity, e.g. "Conditions for SUP".
- The activity name reuses the existing localized labels under `home.activities` (SUP, Kayaking, Snorkelling, Cycling) — no new copy for activity names.
- Both headings reflect whichever activity is selected in the forecast store and update when the selection changes.
- Behaviour is consistent across all four activities.

## Tasks

- Use frontend-developer subagent to add an `{{activity}}` interpolation to three `locationDetail` keys in @app/locales/en/translation.json: `bestAt` → "Best conditions for {{activity}} at {{time}}", `betterAt` → "Better conditions for {{activity}} at {{time}}", `conditions` → "Conditions for {{activity}}".
- Use frontend-developer subagent to read the selected activity in the parent and pass it down @app/(app)/components/location-detail.jsx. Destructure `selectedActivity` from the existing `useForecastStore()` call and pass `activity={selectedActivity}` as a prop to both `<LocationDetailScore>` and `<LocationDetailConditions>`.
- Use frontend-developer subagent to name the activity in the score card @app/(app)/components/location-detail-score.jsx. Accept the new `activity` prop and pass `activity: t(\`home.activities.${activity}\`)` into the existing `t(bestAtKey, { time: bestHourTime })` call. No store access in this component.
- Use frontend-developer subagent to name the activity in the section heading @app/(app)/components/location-detail-conditions.jsx. Accept the new `activity` prop and pass `{ activity: t(\`home.activities.${activity}\`) }` into `t('locationDetail.conditions')`. Update the JSDoc to document the new prop.
- Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/location-detail-activity.feature covering: each of the four activities showing its name in both headings, the heading updating when the selected activity changes, and the marginal/unsuitable "Better conditions for …" variant.
- Use qa-tester subagent to verify the implementation meets the acceptance criteria by executing all BDD scenarios @app/(app)/docs/location-detail-activity.feature via the /execute-scenario command. If any scenario fails, fix the implementation with the frontend-developer subagent and re-run until every scenario passes.
