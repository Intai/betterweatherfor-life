Feature: Add Location Modal
  As an outdoor enthusiast
  I want to search for and add new locations to my list
  So that I can track weather conditions at spots I care about

  Background:
    Given the application is running
    And the "/auckland/home" page is loaded with mock forecast data for 2 Auckland locations:
      | name           | area                   | score | condition  |
      | Mission Bay    | Beach Auckland Central | 85    | Ideal      |
      | Takapuna Beach | Beach North Shore      | 62    | Acceptable |
    And the default selected activity is "SUP"
    And the default selected day is "Today" with time range "All day"

  # =============================================================================
  # Scenario Group: Opening the Add Location Modal
  # =============================================================================

  @purge-data
  Scenario: ALM-01: Tapping the + button opens the Add Location modal on mobile
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    Then the add location (+) button should be visible in the location list header
    When I tap the add location (+) button
    Then the Add Location modal should appear
    And the modal should be positioned fixed to the bottom
    And the modal should have rounded top corners
    And a semi-transparent backdrop should be visible behind the modal

  Scenario Outline: ALM-02: Modal is centred on tablet and desktop at <breakpoint> viewport
    Given the browser viewport is <width>
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    Then the Add Location modal should appear
    And the modal should be centred on the viewport
    And a semi-transparent backdrop should be visible behind the modal

    Examples:
      | breakpoint   | width  |
      | tablet       | 768px  |
      | large tablet | 1024px |
      | desktop      | 1280px |

  # =============================================================================
  # Scenario Group: Closing the Modal
  # =============================================================================

  Scenario: ALM-03: Tapping the close button closes the modal
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    Then the Add Location modal should appear
    And the modal should display the title "Add Location"
    And the modal should display a close (x) button
    And the modal should display a search input field
    And the search input should have a search icon
    And the search input placeholder should be "Search locations..."
    When I tap the close (x) button on the modal
    Then the modal should close
    And the backdrop should no longer be visible

  Scenario: ALM-04: Tapping the backdrop closes the modal
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    Then the Add Location modal should appear
    When I tap the backdrop overlay
    Then the modal should close
    And the backdrop should no longer be visible

  Scenario: ALM-05: Pressing Escape closes the modal
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    Then the Add Location modal should appear
    When I press the Escape key
    Then the modal should close

  # =============================================================================
  # Scenario Group: Autocomplete Results Display
  # =============================================================================

  Scenario: ALM-06: Search results display location name in bold and area in muted text
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    And I type "Mi" into the search input
    And I wait 100ms
    And I type "ssion" into the search input
    And I wait 100ms
    And I type " Bay" into the search input
    And I wait for the search results to appear
    Then the first result should display "Mission Bay" in bold
    And the first result should display "Auckland, New Zealand" in muted text
    And the second result should display "Mission Bay" in bold
    And the second result should display "San Diego, CA, USA" in muted text
    When I clear the search input
    Then the search results should be hidden

  Scenario: ALM-07: Search results list is scrollable when many results are returned
    Given the browser viewport is 667x375px landscape
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    And I type "Beach" into the search input
    And I wait for the search results to appear
    Then the search results list should be scrollable

  # =============================================================================
  # Scenario Group: Selecting a Search Result
  # =============================================================================

  Scenario: ALM-08: Tapping a search result saves the location and closes the modal
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    And I type "Piha" into the search input
    And I wait for the search results to appear
    And I tap the "Piha Beach" result
    Then a POST request should be sent to /api/locations with the location details
    And the modal should close
    And the location "Piha Beach" should be saved to localStorage
    And a Scheduled Location Card for "Piha Beach" should appear after the scored location cards
    And the card should have a dashed border
    And the card header should display the location name "Piha Beach"
    And the card should display the area "Auckland 0772, New Zealand"
    And the card should display a remove (x) button
    And the card should display a cloud icon centred in the card body
    And the card should display the heading "Forecast scheduled"
    And the card should display the description "We've scheduled this location for forecast collection. Check back later -- we'll have conditions ready for you."

  # =============================================================================
  # Scenario Group: Removing a Scheduled Location
  # =============================================================================

  Scenario: ALM-09: Tapping remove button on a Scheduled Location Card removes it
    Given the browser viewport is 375px
    And localStorage contains a saved location "Piha Beach" with no forecast data
    When I navigate to the "/home" page
    Then a Scheduled Location Card should be displayed for "Piha Beach"
    When I tap the remove (x) button on the "Piha Beach" scheduled card
    Then the "Piha Beach" scheduled card should no longer be visible
    And "Piha Beach" should be removed from localStorage

  # =============================================================================
  # Scenario Group: Error Handling
  # =============================================================================

  Scenario: ALM-10: Recovering from a search error by typing a new query
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    Then the Add Location modal should appear
    When the browser blocks domain "maps.googleapis.com"
    And I type "Piha" into the search input
    Then the error message "Search failed. Please try again." should be displayed
    And no search results should be displayed
    When I clear the search input
    Then the error message should no longer be visible
    And the browser unblocks domain "maps.googleapis.com"
    And I type "Mission Bay" into the search input
    Then search results for "Mission Bay" should be displayed

  # =============================================================================
  # Scenario Group: No Results State
  # =============================================================================

  Scenario: ALM-11: No results state is displayed when autocomplete returns empty results
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I tap the add location (+) button
    And I type "xyznonexistent" into the search input
    Then the message "No results found" should be displayed in the modal
    And no search result items should be displayed

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: ALM-12: Modal is keyboard accessible
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I focus on the add location (+) button
    And I press Enter on the focused add location button
    Then the Add Location modal should appear
    And focus should move to the search input field
    When I type "Piha" using the keyboard
    And I wait for the search results to appear
    And I use Tab to navigate to the first search result
    Then the first search result should receive focus
    When I press Enter on the focused search result
    Then the location should be saved and the modal should close

  Scenario: ALM-13: Escape key closes the modal and returns focus to the trigger button
    Given the browser viewport is 375px
    When I navigate to the "/auckland/home" page
    And I press Enter on the add location (+) button
    Then the Add Location modal should appear
    When I press the Escape key
    Then the modal should close
    And the add location (+) button should receive focus

  Scenario: ALM-14: Scheduled Location Card remove button is keyboard accessible
    Given the browser viewport is 375px
    And localStorage contains a saved location "Piha Beach" with no forecast data
    When I navigate to the "/home" page
    And I use Tab to navigate to the remove (x) button on the "Piha Beach" scheduled card
    Then the remove button should receive focus
    When I press Enter on the focused remove button
    Then the "Piha Beach" scheduled card should be removed
    And "Piha Beach" should be removed from localStorage
