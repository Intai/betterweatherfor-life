Feature: Cities in Sidebar
  As a user
  I want to see cities listed in the sidebar
  So that I can quickly navigate to city-specific overview and forecast pages

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Cities Menu Item Display
  # =============================================================================

  Scenario: CT-01: Cities collapsible menu item is displayed after 7-Day Forecast on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the sidebar should display the following navigation items in order:
      | label            | icon     |
      | Home             | House    |
      | 7-Day Forecast   | Calendar |
      | Cities           | Globe    |
      | Buy me a coffee  |          |
      | Join our Discord |          |
    And the "Cities" menu item should display a ChevronRight icon
    And the "Cities" section should be collapsed

  Scenario: CT-02: Cities collapsible menu item is displayed after 7-Day Forecast on desktop
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    Then the sidebar should be visible
    And the sidebar should display the following navigation items in order:
      | label            | icon     |
      | Home             | House    |
      | 7-Day Forecast   | Calendar |
      | Cities           | Globe    |
      | Buy me a coffee  |          |
      | Join our Discord |          |
    And the "Cities" menu item should display a ChevronRight icon
    And the "Cities" section should be collapsed

  # =============================================================================
  # Scenario Group: Expanding and Collapsing Cities
  # =============================================================================

  Scenario: CT-03: Expanding Cities reveals city items with MapPin icons on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    And I tap the "Cities" menu item
    Then the "Cities" section should be expanded
    And the ChevronRight icon on "Cities" should be rotated 90 degrees
    And the city items should be indented under the "Cities" menu item
    And each city item should display a MapPin icon, the city name, and a ChevronRight icon
    When I tap the "Cities" menu item again
    Then the "Cities" section should be collapsed
    And the sidebar should still be visible

  Scenario: CT-04: Expanding Cities reveals city items with MapPin icons on desktop
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    And I click the "Cities" menu item in the sidebar
    Then the "Cities" section should be expanded
    And the ChevronRight icon on "Cities" should be rotated 90 degrees
    And the city items should be indented under the "Cities" menu item
    And each city item should display a MapPin icon, the city name, and a ChevronRight icon
    When I click the "Cities" menu item in the sidebar again
    Then the "Cities" section should be collapsed
    And the ChevronRight icon on "Cities" should not be rotated
    And the city items should not be visible

  # =============================================================================
  # Scenario Group: City Accordion Behaviour
  # =============================================================================

  Scenario: CT-05: Only one city can be expanded at a time (accordion behaviour)
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    And I click the "Cities" menu item in the sidebar
    And I click on the first city item
    Then the first city should be expanded showing sub-nav links "Overview" and "7-Day Forecast"
    And the sub-nav links should not display any icons
    When I click on the second city item
    Then the second city should be expanded showing sub-nav links "Overview" and "7-Day Forecast"
    And the first city should be collapsed
    When I click on the second city item again
    Then the second city should be collapsed
    And no city sub-nav links should be visible

  # =============================================================================
  # Scenario Group: Sub-Nav Link Navigation
  # =============================================================================

  Scenario: CT-06: Clicking a city Overview sub-nav link navigates to the city home page
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    And I click the "Cities" menu item in the sidebar
    And I click on the "Auckland" city item
    And I click the "Overview" sub-nav link under "Auckland"
    Then the browser URL should be "/auckland/home"
    And the page should load without a full page refresh
    When I click the "7-Day Forecast" sub-nav link under "Auckland"
    Then the browser URL should be "/auckland/forecast"
    And the page should load without a full page refresh

  Scenario: CT-07: Clicking a city sub-nav link closes the sidebar drawer on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    And I tap the "Cities" menu item
    And I tap on the "Auckland" city item
    Then the "Auckland" section should be expanded
    And the sidebar should still be visible
    When I tap on the "Auckland" city item again
    Then the "Auckland" section should be collapsed
    And the sidebar should still be visible
    When I tap on the "Auckland" city item again
    And I tap the "Overview" sub-nav link under "Auckland"
    Then the sidebar should close
    And the browser URL should be "/auckland/home"

  # =============================================================================
  # Scenario Group: Active Sub-Nav Highlighting
  # =============================================================================

  Scenario Outline: CT-08: Active sub-nav link is highlighted based on current route
    Given the browser viewport is 1280px
    When I navigate to the "<route>" page
    Then the "Cities" section should be auto-expanded
    And the "Auckland" city should be auto-expanded
    And the "<activeLink>" sub-nav link under "Auckland" should be highlighted as active
    And the other sub-nav link should not be highlighted

    Examples:
      | route              | activeLink     |
      | /auckland/home     | Overview       |
      | /auckland/forecast | 7-Day Forecast |

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: CT-09: Cities menu item and city items are keyboard navigable
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    And I use Tab to navigate to the "Cities" menu item
    Then the "Cities" menu item should receive focus
    When I press Enter on the focused "Cities" menu item
    Then the "Cities" section should be expanded
    When I use Tab to navigate to the first city item
    And I press Enter on the focused city item
    Then the first city should be expanded showing sub-nav links
    When I use Tab to navigate to the "Overview" sub-nav link
    And I press Enter on the focused "Overview" sub-nav link
    Then the browser URL should navigate to the city overview page
