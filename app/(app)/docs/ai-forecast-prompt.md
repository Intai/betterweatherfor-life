Do not output any text. Only use tools. Write all output to the JSON file specified below.

## Data Fetching

Use the Task tool with `subagent_type="general-purpose"` to execute the following 6 in parallel:
- ```
  What is the water quality at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 2 days according to https://safeswim.org.nz/api/locations/{slug}, where the `WATER_QUALITY` array is every hour from now? Respond in JSON format without any explanation, where `waterQuality` must be strictly Green, Orange, Red or Black. Use cURL. Find the closest location slug by https://safeswim.org.nz/api/locations.
  ```
- ```
  When are the tide turning times according to https://tides.niwa.co.nz/?latitude=-36.97484844433063&longitude=174.62043566419308&startDate=2026-02-13&numberOfDays=10 Respond in JSON format without any explanation. Use playwright-headless MCP. Close the Playwright browser when finishes.
  ```
- ```
  What is the swell at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days according to https://windy.app/poi/-36.97484844433063/174.62043566419308 Respond in JSON format without any explanation. Use playwright-headless MCP. Close the Playwright browser when finishes. Selectors:
    | Hours | #cellsTable tr.windywidgethours |
    | Swell height (m) | #cellsTable tr.windywidgetwavesheight |
  ```
- ```
  What are the temperature, feels-like temperature, UV index, precipitation probability, precipitation quantity, wind cardinal direction (e.g. NE, SW WSW, ENE), wind speed, wind gust and humidity at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days according to https://weather.googleapis.com/v1/forecast/hours:lookup?key=${GOOGLE_WEATHER_API_KEY}&location.latitude=-36.97484844433063&location.longitude=174.62043566419308&hours=240&pageSize=24 Respond in JSON format without any explanation. Use cURL. Pass the nextPageToken value into the pageToken to fetch all 10 days.
  ```
- ```
  What is the sea surface temperature at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days according to https://marine-api.open-meteo.com/v1/marine?latitude=-36.97484844433063&longitude=174.62043566419308&hourly=sea_surface_temperature&forecast_days=9 Respond in JSON format without any explanation. Use cURL.
  ```
- ```
  What are the sunrise and sunset times at geolocation -36.97484844433063,174.62043566419308 on 2026-02-13 and for the next 9 days? Use https://api.sunrise-sunset.org/json?lat=-36.97484844433063&lng=174.62043566419308&date={date}&formatted=0 for each date. Respond in JSON format without any explanation, converting UTC times to the local timezone of the geolocation. Include sunrise, sunset, and civilTwilightEnd for each date. Use cURL.
  ```

## Data Granularity

All data sources currently provide hourly or sub-daily granularity. Each field may vary across time windows:
- Wind speed, wind gust, wind direction (hourly)
- Temperature, feels-like temperature (hourly)
- UV index (hourly)
- Precipitation amount, precipitation chance (hourly)
- Humidity (hourly)
- Water quality (hourly)
- Swell height (hourly)
- Sea surface temperature (hourly)
- Tide position (interpolated from turning times)
- Daylight (calculated from sunrise/sunset)

## Scoring Criteria

Score each activity using the criteria below. Condition levels: ideal (80-100), acceptable (60-79), marginal (40-59), unsuitable (<40).

The overall score and condition for each entry is determined by the worst-case factor. For example, if wind is "marginal" (40-59) and all other factors are "ideal" (80-100), the overall score must fall within the "marginal" range (40-59).

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

### Precipitation (mm/hr)

| Condition | SUP | Kayaking | Snorkelling | Cycling |
|---|---|---|---|---|
| Ideal | 0 | 0 | 0 | 0 |
| Acceptable | <0.5 | <0.5 | <0.5 | <0.5 |
| Marginal | 0.5-2 | 0.5-2.5 | 0.5-2 | 0.5-1.5 |
| Unsuitable | >2 | >2.5 | >2 | >1.5 |

Rain beyond a drizzle degrades all activities significantly. Wet conditions reduce safety (slippery surfaces, poor visibility) and comfort across the board. Cycling is slightly more sensitive due to road spray and braking.

### Tide preferences

| Condition | SUP | Kayaking | Snorkelling |
|---|---|---|---|
| Ideal | Slack or incoming | Slack | Incoming ~2hr before high |
| Acceptable | Outgoing, moderate flow | Moderate flow | High or slack |
| Marginal | Strong flow | Strong flow | Low tide |
| Unsuitable | Peak flow | Peak flow + wind | Strong currents |

Cycling: Not affected by tide, set the `tide` field to `null` in the output.

`tide.percentage` = current tide height as a proportion between low and high tide. 0% = low tide, 100% = high tide. Must be between 0 and 100. Interpolate linearly between the nearest low and high tide turning times from the NIWA data.

### Water quality

| Quality | Snorkelling | SUP | Kayaking |
|---|---|---|---|
| Green | Ideal | Ideal | Ideal |
| Orange | Marginal | Acceptable | Acceptable |
| Red | Unsuitable | Unsuitable | Marginal |
| Black | Unsuitable | Unsuitable | Unsuitable |

Cycling: Not affected by water quality, always set the `water` field to `null` in the output.

Water activities: Set the `water` field to `null` for dates beyond the 3-day data range (the start date + next 2 days).

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

### UV index

| Condition | All activities |
|---|---|
| Ideal | ≤5 |
| Acceptable | >5 ≤8 |
| Marginal | >8 ≤10 |
| Unsuitable | >10 |

UV affects all outdoor activities. Water activities have additional exposure from surface reflection.

### Humidity

| Condition | Cycling |
|---|---|
| Ideal | 30-60% |
| Acceptable | 60-75% |
| Marginal | 75-85% |
| Unsuitable | >85% or <20% |

High humidity impairs sweat evaporation during sustained cycling effort. Other activities: set `humidity` to `null`.

### Underwater visibility

Derived composite factor — not directly measured. Estimate from wind speed, swell height, precipitation, and water quality:

| Condition | Estimate |
|---|---|
| Ideal | >8m — calm winds (<8km/h), low swell (<0.5m), no rain, green water |
| Acceptable | 5-8m — light wind or small swell |
| Marginal | 2-5m — moderate wind/swell or recent rain |
| Unsuitable | <2m — high wind/swell, heavy rain, or poor water quality |

Poor visibility reduces the snorkelling experience and can mask hazards like rocks, currents, or marine life. Other activities: set `visibility` to `null`.

## JSON Output

**Write the JSON output to `forecast.json` in the project root directory. Exit immediately after writing the JSON file. Do not take any further actions.**

Using the scoring criteria above, produce a JSON entry for each combination of activity (`sup`, `kayaking`, `snorkelling`, `cycling`) and time window (`all-day`, `morning`, `afternoon`, `evening`) on 2026-02-13 and for the next 9 days.

Time windows:
- Morning: 6am-12pm
- Afternoon: 12pm-6pm
- Evening: 6pm-10pm
- All-day: 6am-10pm

When a time window spans multiple hours, aggregate each factor as follows (these rules apply when hourly data is available; for fields with only daily data, use the single daily value identically across all time windows):
- Wind speed/gust: use the worst-case (highest) value.
- Wind direction: use the predominant direction (most frequent across hours). If tied, use the direction at the hour with the highest wind speed.
- Precipitation: use the worst-case (highest amount, highest chance).
- Tide: use the best condition within the window — users can adjust their trip to the optimal tidal window. The overall score should also use this best tidal condition.
- Water quality: use the worst-case.
- Temperature/feels-like: use the best-case (closest to ideal range) — users can time their activity to the most comfortable part of the window.
- Daylight: use the percentage of the window that falls within usable-light hours.
- UV index: use the worst-case (highest).
- Humidity: use the worst-case (furthest from ideal range).
- Underwater visibility: use the worst-case (lowest estimate).

The `summary` field must explain how conditions affect the specific activity — never use generic labels like "Unsuitable conditions". Mention the dominant factor(s) and why they matter for that activity. Good: "43km/h SW wind is too strong for stable stand-up paddling." Good: "Light 8km/h tailwind, great riding conditions." Bad: "Unsuitable conditions."

The `analysis` field is a multi-paragraph AI analysis for the detail page. Use `\n\n` to separate paragraphs.

The `hourly` array contains hourly scores for the hours within that time range. Each entry has `time` (HH:MM), `score`, and `condition`. When a factor only has daily data, hourly scores for that factor will be identical. Variation in hourly scores should come only from factors with real hourly data (e.g. tide position, water quality, daylight).

Output in the following JSON format:
```
{
  'sup;2026-02-13;all-day;-36.97484844433063,174.62043566419308': {
    name: 'Armour Bay Beach',
    area: 'Beach, Auckland',
    timeZone: 'Pacific/Auckland',
    activity: 'sup',
    date: '2026-02-13',
    timeRange: 'all-day',
    score: 85,
    condition: 'ideal',
    wind: { speed: '8km/h', gust: '12km/h', direction: 'NE', condition: 'ideal', summary: 'Light onshore breeze. Ideal for paddling - will gently push you back to shore.' },
    precipitation: { amount: '0mm', chance: '5%', condition: 'ideal', summary: 'Dry conditions expected through the morning window.' },
    tide: { state: 'Rising', percentage: 70, nextHigh: '10:30', nextLow: '16:15', swell: '0.5m', condition: 'ideal', summary: 'Rising tide with gentle flow. Good water depth at launch. Low 0.5m swell.' },
    water: { quality: 'Green', condition: 'ideal', summary: 'No contamination risk detected. Safe for swimming and paddling.' },
    temp: { air: '22°C', feelsLike: '24°C', water: '20°C', condition: 'ideal', summary: 'Comfortable conditions. Light layers recommended for early morning start.' },
    daylight: { sunset: '20:22', condition: 'ideal' },
    uv: { index: 4, condition: 'ideal', summary: 'Low UV. Sun protection still recommended on the water due to surface reflection.' },
    humidity: null,
    visibility: null,
    summary: 'Light onshore breeze, excellent for paddling this morning.',
    analysis: 'Mission Bay offers excellent conditions for SUP this morning.\n\nThe northeast wind at 8 km/h creates a gentle onshore breeze that will help push you back to shore if you tire.\n\nThe incoming tide means water depth at the launch area will be good.\n\nRecommended window: 7am - 10am before sea breeze strengthens.',
    hourly: [
      { time: '06:00', score: 82, condition: 'ideal' },
      { time: '07:00', score: 85, condition: 'ideal' },
      { time: '08:00', score: 87, condition: 'ideal' },
      { time: '09:00', score: 85, condition: 'ideal' },
      { time: '10:00', score: 78, condition: 'acceptable' },
    ],
  },
  'cycling;2026-02-13;morning;-36.97484844433063,174.62043566419308': {
    name: 'Armour Bay Beach',
    area: 'Beach, Auckland',
    timeZone: 'Pacific/Auckland',
    activity: 'cycling',
    date: '2026-02-13',
    timeRange: 'morning',
    score: 90,
    condition: 'ideal',
    wind: { speed: '12km/h', gust: '18km/h', direction: 'S', condition: 'ideal', summary: 'Light tailwind, great riding conditions.' },
    precipitation: { amount: '0mm', chance: '5%', condition: 'ideal', summary: 'Clear skies through the morning.' },
    tide: null,
    water: null,
    temp: { air: '19°C', feelsLike: '17°C', condition: 'ideal', summary: 'Cool morning air, comfortable for riding.' },
    daylight: { civilTwilightEnd: '20:50', condition: 'ideal' },
    uv: { index: 6, condition: 'acceptable', summary: 'Moderate UV. Sunscreen recommended for extended rides.' },
    humidity: { percentage: '65%', condition: 'ideal', summary: 'Comfortable humidity for riding.' },
    visibility: null,
    summary: 'Light 12km/h tailwind with clear skies, great riding conditions.',
    analysis: 'Light 12km/h tailwind with clear skies, great riding conditions.\n\nModerate UV — apply sunscreen for rides longer than an hour.',
    hourly: [
      { time: '06:00', score: 88, condition: 'ideal' },
      { time: '07:00', score: 90, condition: 'ideal' },
      { time: '08:00', score: 90, condition: 'ideal' },
      { time: '09:00', score: 88, condition: 'ideal' },
      { time: '10:00', score: 85, condition: 'ideal' },
      { time: '11:00', score: 80, condition: 'ideal' },
    ],
  },
  'snorkelling;2026-02-13;morning;-36.97484844433063,174.62043566419308': {
    name: 'Armour Bay Beach',
    area: 'Beach, Auckland',
    timeZone: 'Pacific/Auckland',
    activity: 'snorkelling',
    date: '2026-02-13',
    timeRange: 'morning',
    score: 78,
    condition: 'acceptable',
    wind: { speed: '6km/h', gust: '10km/h', direction: 'NE', condition: 'ideal', summary: 'Calm winds, minimal surface chop.' },
    precipitation: { amount: '0mm', chance: '10%', condition: 'ideal', summary: 'Dry conditions expected.' },
    tide: { state: 'Rising', percentage: 60, nextHigh: '10:30', nextLow: '16:15', swell: '0.3m', condition: 'ideal', summary: 'Incoming tide about 2hr before high. Ideal timing — best visibility as clean water pushes in.' },
    water: { quality: 'Green', condition: 'ideal', summary: 'No contamination risk. Safe for full immersion.' },
    temp: { air: '23°C', feelsLike: '24°C', water: '21°C', condition: 'ideal', summary: 'Warm water, comfortable without a thick wetsuit.' },
    daylight: { sunset: '20:22', condition: 'ideal' },
    uv: { index: 6, condition: 'acceptable', summary: 'Moderate UV. Reef-safe sunscreen recommended — water reflection increases exposure.' },
    humidity: null,
    visibility: { estimate: '6m', condition: 'acceptable', summary: 'Light swell slightly reduces clarity. Expect 5-8m visibility — good for reef fish spotting.' },
    summary: 'Calm 6km/h wind with acceptable underwater visibility around 6m.',
    analysis: 'Armour Bay offers good snorkelling conditions this morning.\n\nCalm 6km/h winds keep surface chop low, and the incoming tide brings cleaner water over the reef.\n\nUnderwater visibility is estimated at 6m — enough to enjoy reef fish and rocky features, though not crystal clear.\n\nBest window: 8am-10am as the tide rises toward high.',
    hourly: [
      { time: '06:00', score: 72, condition: 'acceptable' },
      { time: '07:00', score: 75, condition: 'acceptable' },
      { time: '08:00', score: 78, condition: 'acceptable' },
      { time: '09:00', score: 80, condition: 'ideal' },
      { time: '10:00', score: 76, condition: 'acceptable' },
      { time: '11:00', score: 73, condition: 'acceptable' },
    ],
  },
}
```
