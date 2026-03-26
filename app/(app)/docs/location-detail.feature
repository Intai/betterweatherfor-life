Feature: Location Detail Page
  As an outdoor enthusiast
  I want to view a detailed breakdown of conditions at a specific location
  So that I can understand why a location is scored a certain way, read AI-generated analysis, and find the best hour to go

  Background:
    Given the application is running
    And the "/auckland/home" page is loaded with mock forecast data for 2 Auckland locations:
      | name           | area                   | score | condition  |
      | Mission Bay    | Beach Auckland Central | 85    | Ideal      |
      | Takapuna Beach | Beach North Shore      | 62    | Acceptable |
    And the default selected activity is "SUP"
    And the default selected day is "Today" with time range "All day"

  # =============================================================================
  # Scenario Group: Sticky Header and Navigation
  # =============================================================================

  @purge-data
  Scenario: LDP-01: Sticky header displays location name and back button
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the "Mission Bay" location card
    Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    And the top appbar should be sticky at the top of the viewport
    And the top appbar should display the page title "Mission Bay"
    And the back button should be visible
    And the back button should be styled left-aligned
    And the share button should be visible
    And the share button should be styled right-aligned
    When I tap the share icon in the top app bar
    Then navigator.share should be called with the current URL and "Mission Bay" as the title
    When I tap the back button in the top appbar
    Then the browser URL should be "/auckland/home"

  # =============================================================================
  # Scenario Group: Score Display
  # =============================================================================

  Scenario Outline: LDP-02: Large circular score displays score, condition, and best hour for <name>
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "<activity>" in context
    When I navigate to the "<url>" page
    Then the page title metadata should contain "<name>"
    And a large circular score display should be visible
    And the score circle should display "<score>"
    And the score circle should use the "<theme>" background colour
    And a condition badge pill "<badge>" should be displayed below the score
    And the subtitle "<bestHour>" should be visible

    Examples:
      | activity | name           | url                                        | score | theme                | badge      | bestHour                   |
      | sup      | Mission Bay    | /location/mission-bay/-36.8547,174.8317    | 85    | condition-ideal      | Ideal      | Best conditions at 09:00   |
      | sup      | Takapuna Beach | /location/takapuna-beach/-36.7878,174.7768 | 62    | condition-acceptable | Acceptable | Best conditions at 08:00   |
      | sup      | St Heliers Bay | /location/st-heliers-bay/-36.8508,174.8593 | 58    | condition-marginal   | Marginal   | Better conditions at 06:00 |
      | cycling  | Piha Beach     | /location/piha-beach/-36.9553,174.4681     | 25    | condition-unsuitable | Unsuitable | Better conditions at 19:00 |

  # =============================================================================
  # Scenario Group: Factor Breakdown Cards
  # =============================================================================

  Scenario: LDP-03: Conditions heading and factor cards are displayed for each non-null factor
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    Then the heading "Conditions" should be visible
    And the following factor cards should be displayed in a vertical stack:
      | factor   |
      | Wind     |
      | Tide     |
      | Water    |
      | Temp     |
      | UV Index |
      | Daylight |
    And the following factor cards should not be displayed:
      | factor        |
      | Precipitation |
      | Humidity      |
      | Visibility    |
    And the "Wind" factor card should display an icon in the ideal color
    And the "Wind" factor card should display the heading "Wind"
    And the "Wind" factor card data grid should show:
      | label     | value  |
      | Speed     | 8km/h  |
      | Direction | NE     |
      | Gust      | 12km/h |
    And the "Tide" factor card data grid should show:
      | label     | value      |
      | State     | Rising 70% |
      | High tide | 10:30      |
      | Swell     | 0.3m       |
    And the "Water" factor card data grid should show:
      | label   | value |
      | Quality | Green |
    And the "Temp" factor card data grid should show:
      | label      | value |
      | Air        | 22°C  |
      | Feels like | 24°C  |
      | Water      | 20°C  |
    And the "UV Index" factor card data grid should show:
      | label    | value |
      | UV Index | 4     |
    And the "Daylight" factor card data grid should show:
      | label  | value |
      | Sunset | 19:42 |

  Scenario: LDP-04: Conditions heading and factor cards are displayed for snorkelling at Goat Island
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "snorkelling" in context
    When I navigate to the "/location/goat-island/-36.2675,174.7936" page
    Then the heading "Conditions" should be visible
    And the following factor cards should be displayed in a vertical stack:
      | factor        |
      | Wind          |
      | Tide          |
      | Water         |
      | Temp          |
      | Precipitation |
      | UV Index      |
      | Visibility    |
      | Daylight      |
    And the following factor cards should not be displayed:
      | factor   |
      | Humidity |
    And the "Wind" factor card should display an icon in the acceptable color
    And the "Wind" factor card should display the heading "Wind"
    And the "Wind" factor card data grid should show:
      | label     | value  |
      | Speed     | 10km/h |
      | Direction | NE     |
      | Gust      | 14km/h |
    And the "Visibility" factor card data grid should show:
      | label      | value |
      | Visibility | 6m    |
    And the "Water" factor card data grid should show:
      | label   | value |
      | Quality | Green |
    And the "Tide" factor card data grid should show:
      | label     | value      |
      | State     | Rising 55% |
      | High tide | 11:15      |
      | Swell     | 0.4m       |
    And the "Temp" factor card data grid should show:
      | label      | value |
      | Air        | 23°C  |
      | Feels like | 22°C  |
      | Water      | 21°C  |
    And the "Precipitation" factor card data grid should show:
      | label  | value |
      | Amount | 0mm   |
      | Chance | 10%   |
    And the "UV Index" factor card data grid should show:
      | label    | value |
      | UV Index | 5     |
    And the "Daylight" factor card data grid should show:
      | label  | value |
      | Sunset | 19:38 |

  Scenario: LDP-05: Conditions heading and factor cards are displayed for cycling at Piha Beach
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "cycling" in context
    When I navigate to the "/location/piha-beach/-36.9553,174.4681" page
    Then the heading "Conditions" should be visible
    And the following factor cards should be displayed in a vertical stack:
      | factor        |
      | Wind          |
      | Temp          |
      | Precipitation |
      | UV Index      |
      | Humidity      |
      | Daylight      |
    And the following factor cards should not be displayed:
      | factor     |
      | Tide       |
      | Water      |
      | Visibility |
    And the "Wind" factor card should display the border, an icon and a condition badge in the unsuitable color
    And the "Wind" factor card should display the heading "Wind"
    And the "Wind" factor card data grid should show:
      | label     | value  |
      | Speed     | 42km/h |
      | Direction | SW     |
      | Gust      | 58km/h |
    And the "Temp" factor card data grid should show:
      | label      | value |
      | Air        | 14°C  |
      | Feels like | 8°C   |
    And the "Precipitation" factor card data grid should show:
      | label  | value |
      | Amount | 4.2mm |
      | Chance | 95%   |
    And the "Humidity" factor card data grid should show:
      | label    | value |
      | Humidity | 94%   |
    And the "UV Index" factor card data grid should show:
      | label    | value |
      | UV Index | 2     |
    And the "Daylight" factor card data grid should show:
      | label          | value |
      | Civil twilight | 20:45 |

  # =============================================================================
  # Scenario Group: AI Analysis Section
  # =============================================================================

  Scenario: LDP-06: AI analysis section displays multi-paragraph text in a tinted card
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    Then the heading "AI Analysis" should be visible
    And the AI analysis card should be visible
    And the AI analysis card should have a subtle tint of the "condition-ideal" colour as background
    And the AI analysis card should display 2 paragraphs:
      | paragraph | text                                                                                                                                                        |
      | 1         | Flat water and light winds make Mission Bay one of the best spots for SUP today. The gentle northeast breeze will help keep you cool without creating chop. |
      | 2         | Tide is rising through the morning, providing a gentle push toward shore. Water quality is excellent with no contamination alerts in effect.                |

  Scenario Outline: LDP-07: AI analysis background tint changes with condition level for <name>
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "<activity>" in context
    When I navigate to the "<url>" page
    Then the AI analysis card should have a subtle tint of the "<theme>" colour as background

    Examples:
      | activity    | name           | url                                        | theme                |
      | sup         | Mission Bay    | /location/mission-bay/-36.8547,174.8317    | condition-ideal      |
      | sup         | St Heliers Bay | /location/st-heliers-bay/-36.8508,174.8593 | condition-marginal   |
      | snorkelling | Goat Island    | /location/goat-island/-36.2675,174.7936    | condition-acceptable |
      | cycling     | Piha Beach     | /location/piha-beach/-36.9553,174.4681     | condition-unsuitable |

  # =============================================================================
  # Scenario Group: Hourly Forecast Strip
  # =============================================================================

  Scenario: LDP-08: Forecast strip displays hourly scores with condition colours
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    Then the heading "Forecast" should be visible
    And a horizontally scrollable forecast strip should be visible
    And the forecast strip should display 9 time slots
    And each time slot should show an hour label, score number, and condition bar
    And the "06:00" time slot should display score "72" with an acceptable colour
    And the "09:00" time slot should display score "90" with an ideal colour
    And the "12:00" time slot should display score "76" with a acceptable colour
    And the "09:00" time slot should have a star badge indicating it is the best hour
    And no other time slot should have a star badge
    And I should be able to scroll to see the "14:00" time slot

  # =============================================================================
  # Scenario Group: Responsive Layout - Tablet
  # =============================================================================

  Scenario Outline: LDP-09: Location detail page displays correctly at <breakpoint> viewport
    Given the browser viewport is <width>
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/takapuna-beach/-36.7878,174.7768" page
    Then a share icon button should be visible in the top app bar
    And the score circle should be visible with score "62"
    And the "Conditions" heading should be visible
    And the factor cards should be displayed in a <columnCount>-column grid layout
    And the forecast strip should be visible

    Examples:
      | breakpoint   | width  | columnCount |
      | tablet       | 768px  | 2           |
      | large tablet | 1024px | 3           |
      | desktop      | 1280px | 3           |

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: LDP-10: Back button is keyboard accessible
    Given the browser viewport is 375px
    And the browser cookies are cleared in context
    When I navigate to the "/auckland/home" page
    And I tap the "Mission Bay" location card
    Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    When I use Tab to navigate to the back button
    Then the back button should receive focus
    When I press Enter on the focused back button
    Then the browser should navigate to the "/auckland/home" page

  Scenario: LDP-11: Share icon in app bar is keyboard accessible
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    And I use Tab to navigate to the share icon in the top app bar
    Then the share icon button should receive focus
    When I press Enter on the focused share icon button
    Then the share action should be triggered

  # =============================================================================
  # Scenario Group: Cross-Activity Navigation
  # =============================================================================

  Scenario: LDP-12: Navigating between activities and locations preserves state
    Given the browser viewport is 375px
    And the browser cookies are cleared in context
    When I navigate to the "/auckland/home" page
    Then the "SUP" activity pill should be selected
    And the "Mission Bay" location card should be visible
    And the "Takapuna Beach" location card should be visible

    # Navigate to Mission Bay detail and back
    When I tap the "Mission Bay" location card
    Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    And the top appbar should display the page title "Mission Bay"
    When I tap the back button in the top appbar
    Then the browser URL should be "/auckland/home"
    And the "SUP" activity pill should be selected
    And the "Mission Bay" location card should be visible
    And the "Takapuna Beach" location card should be visible

    # Switch to Snorkelling and navigate to Goat Island
    When I tap the "Snorkelling" activity pill
    Then the "Snorkelling" activity pill should be selected
    And the "Goat Island" location card should be visible
    And the "Mission Bay" location card should not be visible
    When I tap the "Goat Island" location card
    Then I should be on the "/location/goat-island/-36.2675,174.7936" page
    And the top appbar should display the page title "Goat Island"
    When I tap the back button in the top appbar
    Then the browser URL should be "/auckland/home"
    And the "Snorkelling" activity pill should be selected
    And the "Goat Island" location card should be visible

    # Switch to Cycling and navigate to Piha Beach
    When I tap the "Cycling" activity pill
    Then the "Cycling" activity pill should be selected
    And the "Piha Beach" location card should be visible
    And the "Goat Island" location card should not be visible
    When I tap the "Piha Beach" location card
    Then I should be on the "/location/piha-beach/-36.9553,174.4681" page
    And the top appbar should display the page title "Piha Beach"
    When I tap the back button in the top appbar
    Then the browser URL should be "/auckland/home"
    And the "Cycling" activity pill should be selected
    And the "Piha Beach" location card should be visible

    # Switch back to SUP and verify original locations reappear
    When I tap the "SUP" activity pill
    Then the "SUP" activity pill should be selected
    And the "Mission Bay" location card should be visible
    And the "Takapuna Beach" location card should be visible
    And the "Piha Beach" location card should not be visible
