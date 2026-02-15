Feature: Activity Selector and Time Window Picker
  As an outdoor enthusiast
  I want to select my activity and time window
  So that location rankings are tailored to what I plan to do and when

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Activity Selector - Default State and Layout
  # =============================================================================

  Scenario: ATW-01: Activity selector displays all activity pills with SUP selected by default
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    Then the activity selector should be visible
    And the following activity pills should be displayed in a horizontal row:
      | label       |
      | SUP         |
      | Kayaking    |
      | Snorkelling |
      | Cycling     |
    And the "SUP" activity pill should have a filled primary background indicating it is selected
    And the "Kayaking" activity pill should have an outline/ghost style indicating it is unselected
    And the "Snorkelling" activity pill should have an outline/ghost style indicating it is unselected
    And the "Cycling" activity pill should have an outline/ghost style indicating it is unselected

  Scenario: ATW-02: Activity pills wrap to the next line on narrow viewports
    Given the browser viewport is 320px
    When I navigate to the "/home" page
    Then the activity selector should be visible
    And the activity pills that do not fit the viewport width should wrap to the next line

  Scenario: ATW-03: Activity pills display in a single row on wider viewports
    Given the browser viewport is 768px
    When I navigate to the "/home" page
    Then the activity selector should be visible
    And all activity pills should be displayed in a single horizontal row without wrapping

  # =============================================================================
  # Scenario Group: Activity Selector - Selection Behaviour
  # =============================================================================

  Scenario Outline: ATW-04: Selecting the <activity> activity highlights it and deselects others
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I tap the "<activity>" activity pill
    Then the "<activity>" activity pill should have a filled primary background indicating it is selected
    And all other activity pills should have an outline/ghost style indicating they are unselected

    Examples:
      | activity    |
      | SUP         |
      | Kayaking    |
      | Snorkelling |
      | Cycling     |

  Scenario: ATW-05: Switching between activities updates the selected state
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    Then the "SUP" activity pill should be selected
    When I tap the "Kayaking" activity pill
    Then the "Kayaking" activity pill should be selected
    And the "SUP" activity pill should be unselected
    When I tap the "Cycling" activity pill
    Then the "Cycling" activity pill should be selected
    And the "Kayaking" activity pill should be unselected

  # =============================================================================
  # Scenario Group: Time Window Picker - Default State and Layout
  # =============================================================================

  Scenario: ATW-06: Time window picker displays three day options with Today selected by default
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    Then the time window picker should be visible
    And the following day option buttons should be displayed:
      | label           |
      | Today: All day  |
      | Tomorrow        |
      | Pick date       |
    And the "Today" day option should be highlighted as selected
    And the "Tomorrow" day option should have an outline style indicating it is unselected
    And the "Pick date" day option should have an outline style indicating it is unselected
    And the "Today" day option button should display a chevron icon
    When I tap the "Today" day option button
    Then a dropdown should appear with the following time range options:
      | label     |
      | All day   |
      | Morning   |
      | Afternoon |
      | Evening   |
    When I press Escape
    Then the dropdown should close
    When I tap the text area of the "Today" day option button away from the chevron
    Then the same dropdown should appear with time range options

  # =============================================================================
  # Scenario Group: Time Window Picker - Today and Tomorrow Time Range Selection
  # =============================================================================

  Scenario Outline: ATW-07: Selecting <timeRange> time range for <day> updates the button label
    When I navigate to the "/home" page
    And I tap the "<day>" day option button
    And I select the "<timeRange>" time range option
    Then the dropdown should close
    And the "<day>" day option button label should display "<day>: <timeRange>"

    Examples:
      | day      | timeRange |
      | Today    | All day   |
      | Today    | Morning   |
      | Today    | Afternoon |
      | Today    | Evening   |
      | Tomorrow | All day   |
      | Tomorrow | Morning   |
      | Tomorrow | Afternoon |
      | Tomorrow | Evening   |

  # =============================================================================
  # Scenario Group: Time Window Picker - Pick Date
  # =============================================================================

  Scenario: ATW-08: Tapping Pick date opens a popover with calendar and time range radio group
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I tap the "Pick date" day option button
    Then the "Pick date" day option should be highlighted as selected
    And a popover should appear
    And the popover should contain a calendar at the top
    And the calendar should allow selecting dates from today through 14 days ahead, which can across 2 months
    And dates beyond 14 days from today should be disabled
    And dates before today should be disabled
    And the popover should contain a radio group below the calendar with the following time range options:
      | label     |
      | All day   |
      | Morning   |
      | Afternoon |
      | Evening   |
    And the "All day" radio option should be selected by default

  Scenario: ATW-09: Selecting a date and time range in Pick date updates the button label
    Given the browser viewport is 375px
    And the browser locale is "en-NZ"
    When I navigate to the "/home" page
    And I tap the "Pick date" day option button
    And I select a date 3 days from today in the calendar
    And I select the "Morning" radio option in the time range group
    Then the "Pick date" day option button should display the selected date formatted with the browser locale and the time range (e.g. "10 Feb: Morning")

  Scenario: ATW-10: Tapping the picked date button re-opens the popover to change selection
    Given the browser locale is "en-NZ"
    When I navigate to the "/home" page
    And I tap the "Pick date" day option button
    And I select a date 2 days from today in the calendar
    And I select the "Evening" radio option in the time range group
    And I close the popover
    Then the "Pick date" button should display the chosen date and time range
    When I tap the "Pick date" day option button again
    Then the popover should re-open
    And the date 2 days from today should be selected in the calendar
    And the "Evening" radio option should be selected
    When I select a date 4 days from today in the calendar
    And I select the "All day" radio option
    And I close the popover
    Then the "Pick date" button should display the newly chosen date with "All day"

  # =============================================================================
  # Scenario Group: Day Option Switching
  # =============================================================================

  Scenario: ATW-11: Switching from Pick date back to Today resets to Today default
    Given the browser viewport is 375px
    And the browser locale is "en-US"
    When I navigate to the "/home" page
    And I tap the "Pick date" day option button
    And I select a date 3 days from today in the calendar
    And I select the "Morning" radio option in the time range group
    And I close the popover
    Then the "Pick date" button should display the chosen date and "Morning"
    When I tap the "Today" day option button
    Then the "Today" day option should be highlighted as selected
    And the "Pick date" day option should have an outline style indicating it is unselected
    And a dropdown should appear with time range options for Today

  Scenario: ATW-12: Switching between Today and Tomorrow preserves each option's time range independently
    When I navigate to the "/home" page
    And I tap the "Today" day option button
    And I select the "Morning" time range option
    Then the "Today" button label should display "Today: Morning"
    When I tap the "Tomorrow" day option button
    Then the "Tomorrow" button label should display "Tomorrow: Morning"
    And the "Tomorrow" day option should be expanded
    When I select the "Evening" time range option
    Then the "Tomorrow" button label should display "Tomorrow: Evening"
    When I tap the "Today" day option button
    Then the "Today" button label should display "Today: Evening"
    And the "Today" day option should be highlighted as selected

  # =============================================================================
  # Scenario Group: Responsive Behaviour
  # =============================================================================

  Scenario Outline: ATW-13: Activity selector and time window picker display correctly for browser width <width>
    Given the browser viewport is <width>
    When I navigate to the "/home" page
    Then the activity selector should be visible with all activity pills in a single row
    And the time window picker should be visible with all day option buttons displayed
    And the "SUP" activity pill should be selected by default
    And the "Today" day option should display "Today: All day" and be selected by default

    Examples:
      | width  |
      | 768px  |
      | 1024px |
      | 1280px |

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: ATW-14: Activity pills are keyboard navigable
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I use Tab to navigate to the activity selector
    Then focus should land on the first activity pill "SUP"
    When I press Tab to move through the activity pills
    Then focus should move through each activity pill in order: SUP, Kayaking, Snorkelling, Cycling
    When I focus the "Kayaking" activity pill and press Enter
    Then the "Kayaking" activity pill should become selected
    And the "SUP" activity pill should become unselected

  Scenario: ATW-15: Today and Tomorrow dropdown is keyboard accessible
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I use Tab to navigate to the "Today" day option button
    And I press Enter on the "Today" day option button
    Then the time range dropdown should open
    When I use arrow keys to navigate to "Morning"
    And I wait unitl the "Morning" time range option is focused
    And I press Enter to select "Morning"
    Then the dropdown should close
    And the "Today" button label should display "Today: Morning"

  Scenario: ATW-16: Pick date popover is keyboard accessible
    Given the browser viewport is 1280px
    And the browser locale is "en-US"
    When I navigate to the "/home" page
    And I focus on the "Pick date" day option button
    And I press Enter on the "Pick date" day option button
    Then a popover should open with the calendar
    When I focus on today in the calendar
    And I use arrow keys to navigate to 2 days from today in the calendar
    And I press Enter to select a date
    And I use Tab to navigate to the radio group
    And I hold ArrowDown key down
    And I wait until the "Morning" radio option is checked
    And I release the ArrowDown key up
    When I press Escape
    Then the popover should close
    And the "Pick date" button should display the chosen date and the "Morning" time range (e.g. "10 Feb: Morning")
