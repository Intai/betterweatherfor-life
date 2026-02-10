As an outdoor enthusiast, I want to select my activity and time window so that location rankings are tailored to what I plan to do and when.

## Requirements

- Display a horizontal row of pill-shaped activity buttons: SUP, Kayaking, Snorkelling, Cycling.
- Activity pills wrap to the next line if they don't fit the viewport width.
- Highlight the selected activity with a filled primary background; unselected activities use an outline/ghost style.
- Default selected activity is SUP.
- Persist the selected activity in a Zustand store so other components can read it.
- Display three day options: Today, Tomorrow, Pick date.
- Today and Tomorrow show the selected time range as a label (e.g. "Today: All day").
- Tapping anywhere on the Today/Tomorrow button (not just the chevron) reveals time options: All day (default), Morning (6am - 12pm), Afternoon (12pm - 6pm), Evening (6pm - sunset). The chevron is a visual affordance only.
- Pick date opens a single popover with a calendar at the top (limited to 14 days ahead from today) and a radio group below it with the same time options as Today/Tomorrow: All day (default), Morning (6am - 12pm), Afternoon (12pm - 6pm), Evening (6pm - sunset).
- After a date and time range are selected, the Pick date button displays the chosen date and time range (e.g. "10 Feb: Morning"). Format the date using date-fns format with the browser locale for localisation.
- Tapping the picked date button re-opens the popover to change either the date or time range.
- Highlight the selected day option; unselected day options use outline style.
- Default selection is "Today: All day".
- Persist the selected day, selected date (for Pick date), and time range in a Zustand store so other components can read it.
- All visible text is localised via i18next.

## Tasks

**Parallel tasks 1-3:**

1. Use frontend-developer subagent to create Zustand forecast store @app/(app)/stores/forecast-store.js. Export createForecastStore(initialState) factory function that creates a store instance with selectedActivity (default 'sup'), selectedDay (default 'today'), selectedDate (default null, used when day is 'pick-date'), selectedTimeRange (default 'all-day'), and actions setActivity, setDay, setDate, setTimeRange. Export ForecastStoreProvider({ children, initialState }) React context provider that creates a store instance via createForecastStore and provides it through React context. Export useForecastStore hook that reads from the context provider.
2. Use frontend-developer subagent to add i18n translation keys @app/locales/en/translation.json. Add "home.activities.sup", "home.activities.kayaking", "home.activities.snorkelling", "home.activities.cycling", "home.timeWindow.today", "home.timeWindow.tomorrow", "home.timeWindow.pickDate", "home.timeWindow.allDay", "home.timeWindow.morning", "home.timeWindow.afternoon", "home.timeWindow.evening", and "home.timeWindow.todayWithRange" / "home.timeWindow.tomorrowWithRange" interpolated labels.
3. Use qa-tester subagent to plan BDD scenarios @app/(app)/docs/activity-time-window.feature.

**Parallel after task 1 completes:**

4. Use frontend-developer subagent to create activity selector component @app/(app)/components/activity-selector.jsx. Render horizontal flex-wrap row of pill buttons for each activity. Use shadcn Button with variant toggling (primary filled for selected, outline/ghost for unselected). Connect directly to useForecastStore for selectedActivity and setActivity. Match styling from @app/docs/home-ui-design.html activity selector section.
5. Use frontend-developer subagent to create time window picker component @app/(app)/components/time-window-picker.jsx. Render three day option buttons (Today, Tomorrow, Pick date). Today and Tomorrow show selected time range with dropdown chevron. Use shadcn DropdownMenu for time range options (All day, Morning, Afternoon, Evening). Use shadcn Popover and Calendar for Pick date, limiting selectable dates to today through 14 days ahead. Include a shadcn RadioGroup below the calendar for time range selection. After a date is picked, display the date and time range on the button using date-fns format with browser locale. Tapping the picked date button re-opens the picker. Connect directly to useForecastStore for selectedDay, selectedDate, selectedTimeRange and their setters. Match styling from @app/docs/home-ui-design.html time window picker section.

**Sequential task 6 after tasks 4-5 complete:**

6. Use frontend-developer subagent to compose activity selector and time window picker on home page @app/(app)/home/page.js. Wrap page content with ForecastStoreProvider passing initialState. Import and render ActivitySelector and TimeWindowPicker components (they connect to the store directly via useForecastStore). Render activity selector section with bottom border, then time window picker section with bottom border and subtle background, matching the layout from @app/docs/home-layout.md.
