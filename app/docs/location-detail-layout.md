# Location Detail Layout

Detailed view of a single location showing full condition breakdown, AI explanations, and time-based forecasts.

## Mobile Wireframe (375px width)

```
+---------------------------------------+
| [<] Mission Bay                       |
+---------------------------------------+
|                                       |
|          +------------------+         |
|          |                  |         |
|          |       85         |         |
|          |                  |         |
|          +------------------+         |
|               [ Ideal ]               |
|                                       |
+---------------------------------------+
|                                       |
| +-----------------------------------+ |
| | ! Safety Alert                    | |
| |                                   | |
| | UV Index is Very High (9).        | |
| | Apply sunscreen and wear          | |
| | protective clothing.              | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
|                                       |
| Conditions                            |
|                                       |
| +-----------------------------------+ |
| | Wind                              | |
| | --------------------------------- | |
| | Speed:      8 km/h                | |
| | Direction:  NE                    | |
| | Gusts:      12 km/h               | |
| |                                   | |
| | Light onshore breeze. Ideal for   | |
| | paddling - will gently push you   | |
| | back to shore.                    | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| | Tide                              | |
| | --------------------------------- | |
| | State:      Rising                | |
| | Level:      60%                   | |
| | High tide:  10:30am               | |
| |                                   | |
| | Rising tide with gentle flow.     | |
| | Good water depth at launch.       | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| | Water Quality                     | |
| | --------------------------------- | |
| | Safeswim:   Green (Safe)          | |
| | Last check: 15 mins ago           | |
| |                                   | |
| | No contamination risk detected.   | |
| | Safe for swimming and paddling.   | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| | Temperature                       | |
| | --------------------------------- | |
| | Air:        22°C                  | |
| | Feels like: 24°C                  | |
| | Water:      20°C                  | |
| |                                   | |
| | Comfortable conditions. Light     | |
| | layers recommended for early      | |
| | morning start.                    | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| | Precipitation                     | |
| | --------------------------------- | |
| | Current:    None                  | |
| | Forecast:   Clear until 2pm       | |
| | Chance:     5%                    | |
| |                                   | |
| | Dry conditions expected through   | |
| | the morning window.               | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
|                                       |
| AI Analysis                           |
|                                       |
| +-----------------------------------+ |
| | Mission Bay offers excellent      | |
| | conditions for SUP this morning.  | |
| |                                   | |
| | The northeast wind at 8 km/h      | |
| | creates a gentle onshore breeze   | |
| | that will help push you back to   | |
| | shore if you tire. This is much   | |
| | safer than offshore winds.        | |
| |                                   | |
| | The incoming tide means water     | |
| | depth at the launch area will be  | |
| | good, and the gentle tidal flow   | |
| | won't create challenging currents.| |
| |                                   | |
| | Water quality is rated green by   | |
| | Safeswim with no recent rainfall  | |
| | affecting the area. Visibility    | |
| | should be good.                   | |
| |                                   | |
| | Recommended window: 7am - 10am    | |
| | before sea breeze strengthens.    | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
|                                       |
| Forecast                              |
|                                       |
| +-----------------------------------+ |
| | 7am   8am   9am   10am  11am  12p | |
| | --------------------------------- | |
| |  85    87    85    78    65   58  | |
| |  [=]   [=]   [=]   [=]   [-]  [-] | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
|                                       |
|           [ Share Location ]          |
|                                       |
+---------------------------------------+
```

## Safety Alert Variations

### Water Quality Warning

```
| +-----------------------------------+ |
| | !! Water Quality Warning          | |
| |                                   | |
| | Safeswim rates this location      | |
| | ORANGE due to recent rainfall.    | |
| | Swimming not recommended for      | |
| | people with compromised immune    | |
| | systems.                          | |
| +-----------------------------------+ |
```

### Offshore Wind Warning

```
| +-----------------------------------+ |
| | !! Offshore Wind Warning          | |
| |                                   | |
| | Southwest winds (18 km/h) are     | |
| | blowing offshore at this beach.   | |
| | Risk of being pushed away from    | |
| | shore. Consider Mission Bay       | |
| | (onshore winds) instead.          | |
| +-----------------------------------+ |
```

### Thunderstorm Warning

```
| +-----------------------------------+ |
| | !!! Severe Weather Alert          | |
| |                                   | |
| | Thunderstorms forecast from 2pm.  | |
| | Do not paddle after 1pm.          | |
| | Lightning risk on open water is   | |
| | extremely dangerous.              | |
| +-----------------------------------+ |
```

## Snorkelling-Specific View

Additional condition card for snorkelling activity:

```
| +-----------------------------------+ |
| | Visibility                        | |
| | --------------------------------- | |
| | Estimate:   Good (8-10m)          | |
| | Swell:      0.5m                  | |
| | Wind:       5 km/h                | |
| | Water:      Green                 | |
| |                                   | |
| | Low swell and calm winds mean     | |
| | minimal sediment disturbance.     | |
| | No recent rainfall keeping        | |
| | water clarity high.               | |
| +-----------------------------------+ |
```

## Components

### Header
- Sticky position at top
- Back link/arrow (left) returns to Home screen
- Location name as title
- Clean, minimal design

### Score Display
- Large, prominent score number (0-100)
- Score represents the **best hour** within the selected time range (e.g., if user selected "Morning", shows the peak score from that window)
- Circular or rectangular container with score
- Condition badge below (Ideal/Acceptable/Marginal/Unsuitable)
- Badge colour matches condition level
- Forecast strip below reveals which specific hour achieves this peak score

### Safety Alerts Section
- Only displays if warnings exist
- Prominent placement below score
- Alert levels:
  - Info (yellow): UV warnings, general advisories
  - Warning (orange): Marginal conditions, elevated risk
  - Danger (red): Unsafe conditions, do not proceed
- Clear description of the risk
- Actionable guidance where possible

### Tide Icon
See [Home Screen Layout](home-layout.md#tide-icon) for icon specification.

### Factor Breakdown Cards
- Vertical stack of condition cards
- Each card contains:
  - Factor name as heading
  - Key data points with labels
  - AI interpretation paragraph
- Factors vary by activity:
  - SUP/Kayaking: Wind, Tide, Water Quality, Temperature, Precipitation
  - Snorkelling: Wind, Tide, Water Quality, Visibility, Temperature
  - Cycling: Wind, Temperature, Precipitation, UV, Humidity

### AI Explanation Block
- Dedicated section for comprehensive analysis
- Multiple paragraphs explaining:
  - Why overall score is what it is
  - How factors interact
  - Specific recommendations for timing
  - Comparison context if relevant
- Written in conversational, helpful tone

### Time-Based Forecast Strip
- Horizontal scroll showing next 6-12 hours
- Each time slot shows:
  - Hour label
  - Score for that hour
  - Mini condition indicator
- Helps users identify optimal windows
- Visual indicator for current time

### Share Button
- Inline with content at bottom
- Opens native share sheet
- Shares link to location with current settings
- Could include pre-formatted message
- Disabled state for unsuitable conditions (severe weather alerts)
  - Button grayed out with "Not Recommended Today" text
  - Helper text explains sharing is disabled for safety

## Interactions

### Navigation
- Back link returns to Home screen
- Maintains scroll position on Home when returning
- Deep link support for sharing

### Forecast Strip
- Horizontal swipe to see more hours
- Tap a time slot to update entire detail view for that hour (score, conditions, AI analysis all reflect the selected time)
- Default view shows the best hour within the selected time range
- Visual indicators:
  - **Best hour**: Star badge - indicates highest scoring hour in the time range
  - **Selected hour**: Highlighted border - indicates currently displayed hour

### Share Flow
1. Tap Share button
2. Native share sheet opens
3. Options: Copy link, Messages, Email, etc.
4. Shared link opens Location Detail directly

## User Stories Supported

- Sarah understanding why Takapuna scored lower than Mission Bay (factor breakdown comparison)
- Graham viewing detailed explanation for kayaking conditions (AI explanation block)
- Aroha checking visibility and water quality for snorkelling (activity-specific factors)
- SUP paddler warned about offshore winds (safety alerts)
- Kayaker warned about wind-against-tide conditions (safety alerts)
- Snorkeller seeing prominent water quality warnings (safety alerts)
- Users understanding why conditions are rated a certain way (AI explanation)

## Responsive Considerations

- Score display scales appropriately for larger screens
- Factor cards could display in 2-column grid on tablet
- AI explanation benefits from wider line length on desktop
- Forecast strip could show more hours on wider screens
