# Home Screen Layout

The primary landing screen where users select an activity and see ranked locations for their chosen time window.

## Mobile Wireframe (375px width)

```
+--------------------------------------------+
| [=] Better Weather for Life                |
+--------------------------------------------+
|                                            |
| [SUP] [Kayaking] [Snorkelling] [Cycling]   |
|                                            |
+--------------------------------------------+
| [Today: All day v] [Tomorrow] [Pick date]  |
+--------------------------------------------+
|                                            |
| Locations                             [+]  |
|                                            |
| +----------------------------------------+ |
| | Mission Bay                        [x] | |
| | ====================================   | |
| | Score: 85               Ideal          | |
| |                                        | |
| | Wind 8km/h NE   |  Tide: Rising 70%    | |
| | Water: Green    |  Temp: 22°C          | |
| |                                        | |
| | Light onshore breeze, excellent        | |
| | for paddling this morning.             | |
| +----------------------------------------+ |
|                                            |
| +----------------------------------------+ |
| | Takapuna Beach                     [x] | |
| | ===============================        | |
| | Score: 62               Acceptable     | |
| |                                        | |
| | Wind 12km/h SW  |  Tide: Rising 50%    | |
| | Water: Green    |  Temp: 21°C          | |
| |                                        | |
| | Offshore wind component - take         | |
| | care near outer areas.                 | |
| +----------------------------------------+ |
|                                            |
| +----------------------------------------+ |
| | St Heliers Bay                     [x] | |
| | ==========================             | |
| | Score: 58               Marginal       | |
| |                                        | |
| | Wind 15km/h SW  |  Tide: Falling 30%   | |
| | Water: Green    |  Temp: 21°C          | |
| |                                        | |
| | Moderate winds and outgoing tide       | |
| | may create choppy conditions.          | |
| +----------------------------------------+ |
|                                            |
+--------------------------------------------+
```

## Empty State

```
+--------------------------------------------+
| [=] Better Weather for Life                |
+--------------------------------------------+
|                                            |
| [SUP] [Kayaking] [Snorkelling] [Cycling]   |
|                                            |
+--------------------------------------------+
| [Today: All day v] [Tomorrow] [Pick date]  |
+--------------------------------------------+
|                                            |
| Locations                             [+]  |
|                                            |
|                                            |
|           +----------------------+         |
|           |                      |         |
|           |      (pin icon)      |         |
|           |                      |         |
|           |   No locations yet   |         |
|           |                      |         |
|           |  Tap + to add your   |         |
|           |     first spot       |         |
|           |                      |         |
|           +----------------------+         |
|                                            |
|                                            |
+--------------------------------------------+
```

## Add Location Modal

```
+---------------------------------------+
| [x]     Add Location                  |
+---------------------------------------+
|                                       |
| +-----------------------------------+ |
| | Search locations...            Q  | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| | Mission Bay                       | |
| | Beach, Auckland Central           | |
| +-----------------------------------+ |
| | Takapuna Beach                    | |
| | Beach, North Shore                | |
| +-----------------------------------+ |
| | Goat Island                       | |
| | Marine Reserve, Leigh             | |
| +-----------------------------------+ |
| | Maraetai Beach                    | |
| | Beach, East Auckland              | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
```

## Hamburger Menu (Expanded)

```
+---------------------------------------+
| [x] Menu                              |
+---------------------------------------+
|                                       |
| +-----------------------------------+ |
| |  Home                             | |
| +-----------------------------------+ |
| |  7-Day Forecast                   | |
| +-----------------------------------+ |
| |  Settings                         | |
| +-----------------------------------+ |
| |  About                            | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
```

## Components

### Header
- Sticky position at top of viewport
- Hamburger menu icon (left) opens navigation drawer
- App name/logo centered or left-aligned
- Background colour provides contrast with content

### Activity Selector
- Horizontal row of pill-shaped buttons
- Wraps to next line if activities don't fit in viewport width
- Selected activity highlighted with filled background
- Unselected activities have outline/ghost style
- Activities: SUP, Kayaking, Snorkelling, Cycling

### Time Window Picker
- Three options: Today, Tomorrow, Pick date
- Today and Tomorrow display selected time range: "Today: All day v"
- Tapping dropdown reveals time options:
  - All day (default)
  - Morning (6am - 12pm)
  - Afternoon (12pm - 6pm)
  - Evening (6pm - sunset)
- Pick date opens date picker modal with same time range options
- Selected day option highlighted

### List Header
- "Locations" title left-aligned
- Plus button (+) right-aligned with ghost/outline style to add new location
- Tapping + opens search modal overlay

### Location Card
- Full-width card with subtle shadow/border
- Location name as heading with remove button (x)
- Score bar visual (filled portion indicates score 0-100)
- Score bar colour matches the condition badge colour (see below)
- Numeric score represents the **best hour** within the selected time range
- Condition badge (Ideal/Acceptable/Marginal/Unsuitable) reflects this best score
- 2x2 grid of key condition indicators:
  - Wind speed and direction
  - Tide state
  - Water quality (Safeswim rating)
  - Temperature (with dynamic thermometer icon)
- Brief AI-generated condition summary (1-2 sentences)

### Temperature Icon
- Simple tube thermometer (rounded rectangle, no bulb)
- Fill height represents temperature value (0-40°C range)
- Fill colour indicates temperature category:
  - Blue: Cold (< 10°C)
  - Cyan: Cool (10-15°C)
  - Green: Mild (15-20°C)
  - Yellow: Warm (20-25°C)
  - Orange: Hot (25-30°C)
  - Red: Very hot (> 30°C)
- No animation/transition - instant rendering

### Tide Icon
- Chevron/triangle shape indicates tide direction:
  - Chevron pointing UP: Rising tide
  - Chevron pointing DOWN: Falling tide
- Fill level from bottom represents tide percentage (0-100%)
- Light background shape with darker fill overlay
- Fill colour indicates tide suitability for selected activity:
  - Green: Ideal tide conditions
  - Blue: Acceptable tide conditions
  - Orange/Amber: Marginal tide conditions
  - Red: Unsuitable tide conditions
  - Grey: Not applicable (Cycling)
- Activity-specific tide ratings:
  - SUP: Slack or incoming = Ideal; other states = Acceptable; strong flow = Marginal
  - Kayaking: Slack = Ideal; non-peak flow = Acceptable; peak flow or wind-against-tide = Marginal/Unsuitable
  - Snorkelling: Incoming (near high tide) = Ideal; high/slack = Acceptable; low tide = Marginal
  - Cycling: Grey/neutral (tide not relevant)
- No animation/transition - instant rendering

- Entire card tappable to navigate to Location Detail

### Condition Badge Colours
- Ideal (80-100): Green background
- Acceptable (60-79): Blue background
- Marginal (40-59): Orange/Amber background
- Unsuitable (0-39): Red background

### Add Location Modal
- Overlay covering screen with semi-transparent backdrop
- Close button (x) top-left
- Search input field with search icon
- Results list appears as user types
- Each result shows location name and area/type
- Tapping result adds location and closes modal

## Interactions

### Activity Selection
- Tap activity pill to switch active activity
- Location list re-ranks immediately based on new activity criteria
- Smooth transition/animation on list reorder

### Time Window Change
- Tap time option to select
- Location scores update for new time window
- List re-ranks based on updated scores

### Location Card Actions
- Tap card body: Navigate to Location Detail screen
- Tap remove button (x): Confirm removal, remove from list

### Add Location Flow
1. Tap + button in list header
2. Modal slides up from bottom
3. Focus on search input, keyboard appears
4. Type location name, suggestions filter in real-time
5. Tap suggestion to add location
6. Modal closes, new location appears in ranked list
7. List re-sorts to place new location by score

### Menu Navigation
- Tap hamburger icon to open menu
- Menu slides in from left or overlays
- Tap menu item to navigate
- Tap outside menu or x to close

## User Stories Supported

- Sarah checking Saturday morning SUP spots (activity selector + time picker + ranked list)
- Aroha seeing current conditions at favourite snorkelling locations (saved locations + instant ranking)
- Mike finding cycling conditions for today (activity selector + Today time window)
- Returning users with favourite locations remembered (saved location list)
- Users who prefer early mornings seeing morning conditions (time window default)

## Responsive Considerations

- Activity pills wrap to multiple rows on narrow screens
- Location cards stack vertically, single column on mobile
- On tablet/desktop, consider 2-column card grid
- Menu could become persistent sidebar on wider screens
