Feature: 7-Day Forecast Page
  As an outdoor enthusiast
  I want to see a rolling 7-day forecast showing the best location recommendation for each day
  So that I can plan outdoor activities ahead of time based on weather conditions

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Page Header and Navigation
  # =============================================================================

  @purge-data
  Scenario: FRC-01: Forecast page displays sticky header with title and back button
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    Then the top appbar should be sticky at the top of the viewport
    And the top appbar should display the page title "7-Day Forecast"
    And the back button should be visible
    When I tap the back button in the top appbar
    Then the browser URL should be "/auckland/home"

  # =============================================================================
  # Scenario Group: Activity Selector
  # =============================================================================

  Scenario: FRC-02: Switching activity updates all daily recommendation cards
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    Then the activity selector should be visible
    And the following activity pills should be displayed:
      | label       |
      | SUP         |
      | Kayaking    |
      | Snorkelling |
      | Cycling     |
    When I select the "SUP" activity pill
    Then the "SUP" activity pill should be selected
    And 7 day cards should be displayed
    When I tap the "Snorkelling" activity pill
    Then the "Snorkelling" activity pill should be selected
    And the day cards should be stacked vertically in a single column
    And 7 day cards should be displayed
    And the day card scores and locations should reflect snorkelling forecast data

  # =============================================================================
  # Scenario Group: Day Selector Strip
  # =============================================================================

  Scenario: FRC-03: Day selector strip displays 7 day buttons in phone portrait
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    And I select the "SUP" activity pill
    Then the day selector strip should be visible
    And the day selector strip should display 7 day buttons
    And each day button should show a day abbreviation, date number, and mini score badge
    And the mini score badges should be colour-coded by condition:
      | day   | colour     |
      | Day 1 | ideal      |
      | Day 2 | acceptable |
      | Day 3 | acceptable |
      | Day 4 | ideal      |
      | Day 5 | ideal      |
      | Day 6 | marginal   |
      | Day 7 | acceptable |

  Scenario: FRC-04: Tapping a day button in the selector strip smooth-scrolls to that day card
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    And I tap the Day 7 button in the day selector strip
    Then the page should smooth-scroll to the Day 7 card

  Scenario: FRC-05: Day selector strip is hidden in phone landscape
    Given the browser viewport is 667px wide and 375px tall (landscape)
    When I navigate to the "/auckland/forecast" page
    Then the day selector strip should not be visible
    And the day cards should be visible in a horizontal scroll layout
    And I should be able to scroll horizontally to see all 7 day cards

  Scenario Outline: FRC-06: Day selector strip is visible on tablet and desktop
    Given the browser viewport is <width>
    When I navigate to the "/auckland/forecast" page
    Then the day selector strip should be visible
    And the day selector strip should be horizontally scrollable
    And 7 day cards should be displayed in a <columnCount>-column grid layout

    Examples:
      | breakpoint   | width  | columnCount |
      | tablet       | 768px  | 2           |
      | large tablet | 1024px | 3           |
      | desktop      | 1280px | 3           |

  # =============================================================================
  # Scenario Group: Day Card Content - Standard (Non-Unsuitable)
  # =============================================================================

  Scenario Outline: FRC-07: Day card displays all required content
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    Then the Day <day> card should display:
      | element          | expectation                                                |
      | date heading     | a short date format (e.g. "Sat 1 Feb")                     |
      | today chip       | <today>                                                    |
      | best day badge   | <bestDay>                                                  |
      | location name    | Mission Bay                                                |
      | score            | <score>                                                    |
      | score background | <condition>                                                |
      | condition badge  | <condition>                                                |
      | best window      | <bestWindow>                                               |
      | summary          | Light onshore breeze, excellent for paddling this morning. |

    Examples:
      | day | today   | bestDay | score | condition  | bestWindow    |
      | 1   | visible | hidden  | 85    | ideal      | 06:00 - 13:00 |
      | 2   | hidden  | hidden  | 77    | acceptable | 08:00 - 14:00 |
      | 3   | hidden  | hidden  | 70    | acceptable | 06:00 - 12:00 |
      | 4   | hidden  | visible | 95    | ideal      | 09:00 - 14:00 |
      | 5   | hidden  | hidden  | 80    | ideal      | 07:00 - 14:00 |
      | 6   | hidden  | hidden  | 40    | marginal   | 06:00 - 11:00 |
      | 7   | hidden  | hidden  | 65    | acceptable | 06:00 - 10:00 |

  # =============================================================================
  # Scenario Group: Day Card Content - Unsuitable Day
  # =============================================================================

  Scenario: FRC-08: Unsuitable day card shows simplified display with no location recommendation
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    And I select the "Cycling" activity pill
    Then the Day <day> card should display:
      | element          | expectation                                                                                             |
      | date heading     | a short date format (e.g. "Wed 5 Feb")                                                                  |
      | today chip       | <today>                                                                                                 |
      | best day badge   | hidden                                                                                                  |
      | location name    | hidden                                                                                                  |
      | score            | <score>                                                                                                 |
      | score background | unsuitable                                                                                              |
      | condition badge  | unsuitable                                                                                              |
      | best window      | No recommended window                                                                                   |
      | summary          | 42km/h SW headwind with heavy rain and 94% humidity make cycling dangerous and extremely uncomfortable. |

    Examples:
      | day | today   | score |
      | 1   | visible | 25    |
      | 2   | hidden  | 17    |
      | 3   | hidden  | 10    |
      | 4   | hidden  | 35    |
      | 5   | hidden  | 20    |
      | 6   | hidden  | 0     |
      | 7   | hidden  | 5     |

  # =============================================================================
  # Scenario Group: Card Navigation
  # =============================================================================

  Scenario: FRC-09: Tapping a day card navigates to Home with that day selected
    Given the browser viewport is 375px
    And the browser locale is set to en-NZ in context
    When I navigate to the "/auckland/forecast" page
    And I select the "SUP" activity pill
    And I tap the Day 2 card with acceptable condition
    Then the browser should navigate to the "/auckland/home" page
    And the time picker should be set to the Day 2 date
    When I navigate back
    And I tap the Day 6 card with marginal condition
    Then the browser should navigate to the "/auckland/home" page
    And the time picker should be set to the Day 6 date
    When I navigate back
    And I select the "Cycling" activity pill
    And I tap the Day 2 card with unsuitable condition
    Then the browser should navigate to the "/auckland/home" page
    And the time picker should be set to the Day 2 date

  # =============================================================================
  # Scenario Group: Empty State
  # =============================================================================

  Scenario: FRC-10: Empty state is displayed when no locations are saved
    Given the browser viewport is 375px
    And the browser local storage is cleared in context
    When I navigate to the "/forecast" page
    Then the empty state should be displayed
    And a calendar icon should be visible in the empty state
    And the empty state message should be visible
    And a "Go to Home" button should be visible
    When I tap the "Go to Home" button
    Then the browser should navigate to the "/home" page
    When I navigate to the "/auckland/forecast" page
    And I select the "Kayaking" activity pill
    Then the empty state should be displayed
    When I tap the "Go to Home" button
    Then the browser should navigate to the "/home" page

  # =============================================================================
  # Scenario Group: Routing
  # =============================================================================

  Scenario: FRC-11: Client-side forecast route loads with localStorage locations
    Given the browser viewport is 1280px
    And the browser local storage is cleared in context
    When I navigate to the "/auckland/home" page
    And I select the "SUP" activity pill
    When I tap the add location (+) button
    And I type "Amour Bay" into the search input
    And I wait for the search results to appear
    And I select the first result "Amour Bay"
    And I tap the "7-Day Forecast" sidebar menu item
    Then 7 day cards should be displayed

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: FRC-12: Day cards are keyboard accessible
    Given the browser viewport is 375px
    And the browser locale is set to en-NZ in context
    When I navigate to the "/auckland/forecast" page
    And I use Tab to navigate to the first day card
    Then the first day card should receive focus
    When I press Enter on the focused day card
    Then the browser should navigate to the "/auckland/home" page with the Day 1 date selected

  Scenario: FRC-13: Day selector strip buttons are keyboard accessible
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    And I use Tab to navigate to the day selector strip
    Then focus should land on the first day button
    When I press Tab to move through the day buttons
    Then focus should move through each day button in order
    When I press Enter on the focused day button
    Then the page should smooth-scroll to the corresponding day card

  Scenario: FRC-14: Back button is keyboard accessible
    Given the browser viewport is 375px
    When I navigate to the "/auckland/forecast" page
    And I use Tab to navigate to the back button
    Then the back button should receive focus
    When I press Enter on the focused back button
    Then the browser should navigate to the "/auckland/home" page
