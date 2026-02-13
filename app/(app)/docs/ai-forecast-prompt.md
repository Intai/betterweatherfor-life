## Data Fetching

Use the Task tool with `subagent_type="general-purpose"` to execute the following 4 in parallel:
- ```
  What is the water quality at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 2 days according to https://safeswim.org.nz/api/locations/{slug}, where the `WATER_QUALITY` array is every hour from now? Respond in JSON format without any explanation, where `waterQuality` must be strictly Green, Orange, Red or Black. Use playwright-headless MCP. Find the closest location slug by https://safeswim.org.nz/api/locations.
  ```
- ```
  When are the tide turning times according to https://tides.niwa.co.nz/?latitude=-36.97484844433063&longitude=174.62043566419308&startDate=2026-02-13&numberOfDays=10 Respond in JSON format without any explanation. Use playwright-headless MCP.
  ```
- ```
  What are the wind speed, direction, precipitation and temperature at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days according to https://windy.app/poi/-36.97478682491218/174.62047576904297 Respond in JSON format without any explanation. Use playwright-headless MCP. Wind directions are like `<td style="transform: rotate(246deg)">↑</td>`, which can be identified by selector `#cellsTable tr.windywidgetwindDirection td`. e.g. rotate(246deg) of ↑ is ENE. Other selectors:
    | Hours | #cellsTable tr.windywidgethours |
    | Temperatures | #cellsTable tr.windywidgetairTemp |
    | Wind speed | #cellsTable tr.windywidgetwindSpeed |
    | Precipitation | #cellsTable tr#percipCell text.precip-graph-value |
  ```
- ```
  What are the sunrise and sunset times at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days? Use https://api.sunrise-sunset.org/json?lat=-36.97484844433063&lng=174.62043566419308&date={date}&formatted=0 for each date. Respond in JSON format without any explanation, converting UTC times to the local timezone of the geolocation. Include sunrise, sunset, and civilTwilightEnd for each date.
  ```

## Scoring Criteria

Score each activity using the criteria below. Condition levels: ideal (80-100), acceptable (60-79), marginal (40-59), unsuitable (<40).

### Wind thresholds (km/h)

| Condition | SUP | Kayaking | Snorkelling | Cycling |
|---|---|---|---|---|
| Ideal | <9 | <13 | <8 | <15 |
| Acceptable | 9-18 | 13-20 | 8-15 | 15-25 |
| Marginal | 18-27 | 20-27 | 15-22 | 25-35 |
| Unsuitable | >27 | >27 | >22 | >35 |

SUP requires calmer wind than kayaking — standing on a board has a high center of gravity, making it far more wind-sensitive than seated kayaking.

Wind direction:
- SUP: Onshore/cross-shore ideal, offshore unsuitable.
- Kayaking: Calm ideal, wind-against-tide unsuitable.
- Snorkelling: Calm ideal (affects surface chop and visibility).
- Cycling: Headwind/crosswind degrades, tailwind helps.

### Precipitation (mm/3hr)

| Condition | SUP | Kayaking | Snorkelling | Cycling |
|---|---|---|---|---|
| Ideal | 0 | 0 | 0 | 0 |
| Acceptable | <1 | <1 | <1 | <1 |
| Marginal | 1-4 | 1-5 | 1-4 | 1-3 |
| Unsuitable | >4 | >5 | >4 | >3 |

Rain beyond a drizzle degrades all activities significantly. Wet conditions reduce safety (slippery surfaces, poor visibility) and comfort across the board. Cycling is slightly more sensitive due to road spray and braking.

### Tide preferences

| Condition | SUP | Kayaking | Snorkelling |
|---|---|---|---|
| Ideal | Slack or incoming | Slack | Incoming ~2hr before high |
| Acceptable | Outgoing, moderate flow | Moderate flow | High or slack |
| Marginal | Strong flow | Strong flow | Low tide |
| Unsuitable | Peak flow | Peak flow + wind | Strong currents |

Cycling: Not affected by tide, set the `tide` field to `null` in the output.

### Water quality (graduated by immersion)

| Quality | Snorkelling | SUP | Kayaking |
|---|---|---|---|
| Green | Ideal | Ideal | Ideal |
| Orange | Marginal | Acceptable | Acceptable |
| Red | Unsuitable | Unsuitable | Marginal |
| Black | Unsuitable | Unsuitable | Unsuitable |

Set the `water` field to `null` in the output for cycling (not affected by water quality) and for dates beyond the 3-day data range (the start date + next 2 days).

### Temperature (°C)

| Condition | SUP | Kayaking | Snorkelling | Cycling |
|---|---|---|---|---|
| Ideal | 20-28 | 18-26 | — | 15-22 |
| Acceptable | 15-30 | 15-30 | — | 10-28 |
| Marginal | — | — | — | 5-10 or 28-33 |
| Unsuitable | Extreme | Extreme | — | <5 or >33 |

Cycling prefers cooler temps (body heat from pedaling). SUP needs warmer air (wind chill + water immersion). Snorkelling not a primary factor (wetsuit assumed).

### Daylight

Water activities (snorkelling, SUP, kayaking) are unsafe after sunset. Cycling visibility degrades after sunset but remains possible with lights until civil twilight end.

Calculate the percentage of usable-light hours within each time window:
- Water activities: usable light = sunrise to sunset
- Cycling: usable light = sunrise to civil twilight end

| Condition | Water activities | Cycling |
|---|---|---|
| Ideal | 100% of window in daylight | 100% of window before civil twilight end |
| Acceptable | >=75% of window in daylight | >=75% of window before civil twilight end |
| Marginal | 60-74% of window in daylight | 60-74% of window before civil twilight end |
| Unsuitable | <60% of window in daylight | <60% of window before civil twilight end |

If daylight is "unsuitable", cap the overall score at 35 regardless of other factors.

## JSON Output

**Write the JSON output to `forecast.json` in the project root directory.**

Using the scoring criteria above, produce a JSON entry for each combination of activity (`sup`, `kayaking`, `snorkelling`, `cycling`) and time window (`all-day`, `morning`, `afternoon`, `evening`) on 2026-02-13 and for the next 9 days.

Time windows:
- Morning: 6am-12pm
- Afternoon: 12pm-6pm
- Evening: 6pm-10pm
- All-day: 6am-10pm

When a time window spans multiple hours, use the worst-case condition (e.g. highest wind speed, highest precipitation, worst water quality, strongest tidal flow, lowest daylight percentage) to determine the score.

Output in the following JSON format:
```
{
  'sup;2026-02-13;all-day;-36.97484844433063,174.62043566419308': {
    name: 'Armour Bay Beach',
    area: 'Beach, Auckland',
    timeZone: 'Pacific/Auckland',
    score: 85,
    condition: 'ideal',
    wind: { speed: '8km/h', direction: 'NE', condition: 'ideal' },
    precipitation: { amount: '0mm', condition: 'ideal' },
    tide: { state: 'Rising', percentage: 70, condition: 'ideal' },
    water: 'Green',
    temp: '22°C',
    daylight: { sunset: '20:22', condition: 'ideal' },
    summary: 'Light onshore breeze, excellent for paddling this morning.',
  },
}
```
