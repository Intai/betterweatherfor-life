Feature: Home Locations
  As an outdoor enthusiast visiting a city page
  I want to see ranked locations with weather conditions for my selected activity and time window
  So that I can quickly find the best spots to go

  Background:
    Given the application is running
    And the "/auckland/home" page is loaded with mock forecast data for 3 Auckland locations:
      | name           | area                   | score | condition  | wind_speed | wind_direction | wind_condition | tide_state | tide_percentage | water | temp | summary                                                        |
      | Mission Bay    | Beach Auckland Central | 85    | Ideal      | 8km/h      | NE             | Ideal          | Rising     | 70%             | Green | 22   | Light onshore breeze, excellent for paddling this morning.     |
      | Takapuna Beach | Beach North Shore      | 62    | Acceptable | 12km/h     | SW             | Acceptable     | Rising     | 50%             | Green | 21   | Offshore wind component - take care near outer areas.          |
      | St Heliers Bay | Beach East Auckland    | 58    | Marginal   | 15km/h     | SW             | Marginal       | Falling    | 30%             | Green | 21   | Moderate winds and outgoing tide may create choppy conditions. |
    And the default selected activity is "SUP"
    And the default selected day is "Today" with time range "All day"

  # =============================================================================
  # Scenario Group: Location Card Layout and Content
  # =============================================================================

  @purge-data
  Scenario: LOC-01: Location card displays all required sections
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then the location cards should appear in the following order from top to bottom:
      | position | name           | score |
      | 1        | Mission Bay    | 85    |
      | 2        | Takapuna Beach | 62    |
      | 3        | St Heliers Bay | 58    |
    And the card should display the location name "Mission Bay"
    And the card should display the area "Beach, Auckland Central"
    And the card should display a remove (x) button
    And the card should display a score bar
    And the card should display the score label "85"
    And the card should display the condition badge "Ideal"
    And the card should display a 2x2 conditions grid with Wind, Tide, Water, and Temp:
      | label | value      |
      | Wind  | 8km/h NE   |
      | Tide  | Rising 70% |
      | Water | Green      |
      | Temp  | 22°C       |
    And the card should display the AI summary "Light onshore breeze, excellent for paddling this morning."

  # =============================================================================
  # Scenario Group: Score Bar Display and Condition Colours
  # =============================================================================

  Scenario Outline: LOC-02: Score bar and condition badge colour matches condition level for <location>
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then the "<location>" score bar fill should have style "width:<score>%"
    And the "<location>" score bar fill should use a <colour> colour
    And the "<location>" card should show score <score> and condition "<condition>"
    And the "<location>" condition badge should use a <colour> background colour

    Examples:
      | location       | score | condition  | colour |
      | Mission Bay    | 85    | Ideal      | green  |
      | Takapuna Beach | 62    | Acceptable | sky    |
      | St Heliers Bay | 58    | Marginal   | orange |

  # =============================================================================
  # Scenario Group: Empty State
  # =============================================================================

  Scenario: LOC-03: Empty state is displayed after switching to an activity with no matching locations
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then 3 location cards should be displayed
    When I tap the "Kyaking" activity pill
    Then the location list should show the empty state
    And the add location (+) button should still be visible
    And a map pin icon should be displayed centered in the empty state card
    And the heading "No locations yet" should be visible
    And the subtitle "Tap + to add your first spot" should be visible
    And no location cards should be displayed

  Scenario: LOC-04: Changing filters to a combination with no entries shows empty state
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then 3 location cards should be displayed
    When I tap the "Tomorrow" day option button
    Then the empty state should be displayed

  # =============================================================================
  # Scenario Group: Remove Location
  # =============================================================================

  Scenario: LOC-05: Tapping remove button removes the location card from the list
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then 3 location cards should be displayed
    When I tap the remove (x) button on the "Takapuna Beach" card
    Then the "Takapuna Beach" card should no longer be visible
    And 2 location cards should be displayed
    And the remaining cards should be "Mission Bay" and "St Heliers Bay" in that order

  Scenario: LOC-06: Removing all locations shows the empty state
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then 3 location cards should be displayed
    When I tap the remove (x) button on the "Mission Bay" card
    Then 2 location cards should be displayed
    When I tap the remove (x) button on the "Takapuna Beach" card
    Then 1 location card should be displayed
    When I tap the remove (x) button on the "St Heliers Bay" card
    Then 0 location cards should be displayed
    And the empty state should be visible with "No locations yet" heading

  # =============================================================================
  # Scenario Group: Conditions Grid Icons
  # =============================================================================

  Scenario: LOC-07: Wind, Tide, Water and Temperature condition icons
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then the "Mission Bay" card Wind condition should display a wind arrow icon
    And the Wind value should show "8km/h NE"
    And the "Mission Bay" card Tide condition should display a chevron icon pointing up for rising tide
    And the Tide value should show "Rising 70%"
    And the chevron fill level should represent the 70% tide percentage
    And the "Mission Bay" card Water condition should display a water droplet icon
    And the Water value should show "Green"
    And the "Mission Bay" card Temp condition should display a thermometer icon
    And the Temp value should show "22°C"
    And the thermometer fill height should represent 22 degrees on a 0-40 range

  # =============================================================================
  # Scenario Group: Responsive Layout
  # =============================================================================

  Scenario: LOC-08: Location cards display in a single column on mobile
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then the location cards should be stacked vertically in a single column
    And each card should be full-width within the content area

  Scenario Outline: LOC-09: Location list displays correctly at <breakpoint> viewport
    Given the browser viewport is <width>
    When I navigate to the "/auckland/home" page
    Then the "Locations" heading should be visible
    And the add location (+) button should be visible
    And 3 location cards should be displayed
    And the cards should be in a grid layout

    Examples:
      | breakpoint   | width  |
      | tablet       | 768px  |
      | large tablet | 1024px |
      | desktop      | 1280px |

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: LOC-10: Remove button is keyboard accessible
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I focus on the add location (+) button
    And I use Tab to navigate to the remove (x) button on the "Mission Bay" card
    Then the remove button should receive focus
    When I press Enter on the focused remove button
    Then the "Mission Bay" card should be removed from the list
    And 2 location cards should remain
    When I use Shift+Tab to navigate back to the add location (+) button
    Then the add location button should receive focus
    When I press Tab twice
    Then the the remove (x) button on the "Takapuna Beach" card should receive focus
