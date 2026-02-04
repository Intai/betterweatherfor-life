# 7-Day Forecast Layout

Rolling 7-day forecast (today + next 6 days) showing condition forecasts to help users plan activities ahead of time. Displays the best location recommendation for each day based on the selected activity.

## Mobile Wireframe (375px width)

```
+---------------------------------------+
| [<] 7-Day Forecast                    |
+---------------------------------------+
|                                       |
| [SUP] [Kayaking] [Snorkelling]        |
| [Cycling]                             |
|                                       |
+---------------------------------------+
|                                       |
| [Mon] [Tue] [Wed] [Thu] [Fri] [Sat>   |
|  28    29    30    31    1     2      |
+---------------------------------------+
|                                       |
| +-----------------------------------+ |
| |  Friday 1 Feb            [Best]   | |
| | --------------------------------- | |
| |                                   | |
| | Best spot: Mission Bay            | |
| |                                   | |
| |     +------------------+          | |
| |     |       92         |          | |
| |     +------------------+          | |
| |          [ Ideal ]                | |
| |                                   | |
| | Best window: 7am - 11am           | |
| |                                   | |
| | Calm winds, incoming tide,        | |
| | perfect morning for paddling.     | |
| |                                   | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| |  Saturday 2 Feb                   | |
| | --------------------------------- | |
| |                                   | |
| | Best spot: Takapuna Beach         | |
| |                                   | |
| |     +------------------+          | |
| |     |       78         |          | |
| |     +------------------+          | |
| |        [ Acceptable ]             | |
| |                                   | |
| | Best window: 6am - 9am            | |
| |                                   | |
| | Light winds early, increasing     | |
| | after 10am. Go early.             | |
| |                                   | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| |  Sunday 3 Feb                     | |
| | --------------------------------- | |
| |                                   | |
| | Best spot: Mission Bay            | |
| |                                   | |
| |     +------------------+          | |
| |     |       65         |          | |
| |     +------------------+          | |
| |        [ Acceptable ]             | |
| |                                   | |
| | Best window: 3pm - 6pm            | |
| |                                   | |
| | Morning rain clearing, afternoon  | |
| | offers a decent window.           | |
| |                                   | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| |  Monday 4 Feb                     | |
| | --------------------------------- | |
| |                                   | |
| | Best spot: St Heliers Bay         | |
| |                                   | |
| |     +------------------+          | |
| |     |       45         |          | |
| |     +------------------+          | |
| |         [ Marginal ]              | |
| |                                   | |
| | Best window: 12pm - 2pm           | |
| |                                   | |
| | Moderate winds throughout.        | |
| | Consider postponing if flexible.  | |
| |                                   | |
| +-----------------------------------+ |
|                                       |
| +-----------------------------------+ |
| |  Tuesday 5 Feb                    | |
| | --------------------------------- | |
| |                                   | |
| |     +------------------+          | |
| |     |       28         |          | |
| |     +------------------+          | |
| |        [ Unsuitable ]             | |
| |                                   | |
| | Strong winds and rain forecast.   | |
| | Not recommended for paddling.     | |
| |                                   | |
| +-----------------------------------+ |
|                                       |
+---------------------------------------+
```

## Day Selector Strip Detail

```
+---------------------------------------+
|                                       |
| [Mon] [Tue] [Wed] [Thu] [Fri] [Sat>   |
|  28    29    30    31    1     2      |
|  --    --    --    --   [92]  [78]    |
+---------------------------------------+

Legend:
- Day abbreviation on top row
- Date number on second row
- Mini score badge on third row (optional)
- Scroll right to see more days
- Today marked with distinct style
```

## No Locations State

```
+---------------------------------------+
| [<] 7-Day Forecast                    |
+---------------------------------------+
|                                       |
| [SUP] [Kayaking] [Snorkelling]        |
| [Cycling]                             |
|                                       |
+---------------------------------------+
|                                       |
| [Mon] [Tue] [Wed] [Thu] [Fri] [Sat>   |
|  28    29    30    31    1     2      |
|                                       |
+---------------------------------------+
|                                       |
|                                       |
|         +-------------------+         |
|         |                   |         |
|         |   (calendar icon) |         |
|         |                   |         |
|         | Add locations to  |         |
|         | see 7-day         |         |
|         | forecasts         |         |
|         |                   |         |
|         | [Go to Home]      |         |
|         |                   |         |
|         +-------------------+         |
|                                       |
|                                       |
+---------------------------------------+
```

## Components

### Header
- Sticky position at top
- Back link returns to Home screen
- "7-Day Forecast" as title

### Activity Selector
- Same component as Home screen
- Horizontal row of pill buttons
- Wraps to next line if activities don't fit (matches home screen behavior)
- Changing activity updates all daily recommendations

### Day Selector Strip
- Horizontal scrollable date selector
- Shows today + next 6 days (rolling 7-day range)
- Each date shows:
  - Day abbreviation (Mon, Tue, etc.)
  - Date number
  - Optional mini score indicator
- Today marked distinctly
- Scroll to see all 7 days

### Daily Summary Card
- Full-width card for each day
- Contains:
  - Day and date heading
  - "Best Day" badge if highest score in forecast
  - Best location name from user's saved list
  - Large score display
  - Condition badge (Ideal/Acceptable/Marginal/Unsuitable)
  - Best time window
  - Brief condition summary
- Entire card tappable

### "Best Day" Badge
- Only shown on the day with highest score
- Prominent visual indicator
- Helps users quickly identify optimal day

### Unsuitable Day Card
- Simplified display when no good conditions
- Shows low score
- Unsuitable badge
- Brief explanation
- No specific location recommended

## Interactions

### Activity Selection
- Tap activity to switch
- All daily cards update with new activity rankings
- Scores recalculated per activity criteria

### Day Selector Navigation
- Horizontal swipe to scroll through days
- Tap a day to smooth scroll to that day's card

### Day Card Tap
- Navigates to Home screen
- Time picker automatically set to that day
- User sees full ranked list for that day
- Can then tap a location for detail view

### "Best Day" Interaction
- Visual highlight draws attention
- Same tap behavior as other day cards

## Ranking Logic

For each day in the 7-day forecast:

1. Get forecast conditions for that day
2. For each location in user's saved list:
   - Calculate score for selected activity
   - Identify best time window
3. Rank locations by score
4. Display top-scoring location as recommendation
5. Mark day with highest score as "Best Day"

## User Stories Supported

- Graham planning a club kayaking trip for next week (7-day forecast)
- Mike identifying best weather windows for training rides (best time windows)
- Sarah comparing Saturday vs Sunday conditions (side-by-side daily cards)
- Weekend paddler comparing conditions across days (scrollable day cards)
- Kayaking club organiser seeing 5 days ahead (extended forecast view)
- Busy professional finding best weather windows in coming week (Best Day badge)

## Responsive Considerations

- Portrait: Cards stack vertically (scroll down)
- Landscape: Cards scroll horizontally in single row (no day selector strip - cards serve as navigation)
- Swipe gesture works naturally in both orientations

## Landscape Wireframe

```
+--------------------------------------------------------------------------------+
| [<] 7-Day Forecast                                                              |
+--------------------------------------------------------------------------------+
| [SUP] [Kayaking] [Snorkelling] [Cycling]                                        |
+--------------------------------------------------------------------------------+
| +---------------------+  +---------------------+  +---------------------+  -->  |
| |  Friday 1 Feb [Best]|  |  Saturday 2 Feb     |  |  Sunday 3 Feb       |       |
| | ------------------- |  | ------------------- |  | ------------------- |       |
| | Best spot:          |  | Best spot:          |  | Best spot:          |       |
| | Mission Bay         |  | Takapuna Beach      |  | Mission Bay         |       |
| |    +----------+     |  |    +----------+     |  |    +----------+     |       |
| |    |    92    |     |  |    |    78    |     |  |    |    65    |     |       |
| |    +----------+     |  |    +----------+     |  |    +----------+     |       |
| |      [ Ideal ]      |  |    [ Acceptable ]   |  |    [ Acceptable ]   |       |
| | Best window:        |  | Best window:        |  | Best window:        |       |
| | 7am - 11am          |  | 6am - 9am           |  | 3pm - 6pm           |       |
| | Calm winds,         |  | Light winds early,  |  | Morning rain        |       |
| | incoming tide,      |  | increasing after    |  | clearing, afternoon |       |
| | perfect morning     |  | 10am. Go early.     |  | offers decent       |       |
| | for paddling.       |  |                     |  | window.             |       |
| +---------------------+  +---------------------+  +---------------------+  -->  |
+--------------------------------------------------------------------------------+
```
