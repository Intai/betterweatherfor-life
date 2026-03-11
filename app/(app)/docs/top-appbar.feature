Feature: Top Appbar
  As a user
  I want a responsive top appbar that adapts to the current page and screen size
  So that I always have clear navigation context whether I am on /home or /forecast at any breakpoint

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Mobile/Tablet Home Header
  # =============================================================================

  Scenario Outline: TAB-01: Top appbar on /home at <breakpoint> shows app logo, app name, and hamburger menu
    Given the browser viewport is <width>
    When I navigate to the "/home" page
    Then the mobile home top appbar should be visible
    And the top appbar should display the app logo
    And the top appbar should display the app name "Better Weather for"
    And the hamburger menu button should be visible and right-aligned
    And the top appbar should be sticky at the top of the viewport
    When I tap the hamburger menu button in the top appbar
    Then the sidebar should be visible

    Examples:
      | breakpoint   | width  |
      | mobile       | 375px  |
      | tablet       | 768px  |
      | large tablet | 1024px |

  # =============================================================================
  # Scenario Group: Mobile/Tablet Forecast Header
  # =============================================================================

  Scenario Outline: TAB-02: Top appbar on /forecast at <breakpoint> shows back button and page title
    Given the browser viewport is <width>
    When I navigate to the "/forecast" page
    Then the mobile sub-page top appbar should be visible
    And the back button should be visible and left-aligned
    And the top appbar should display the page title "7-Day Forecast"
    And the top appbar should be sticky at the top of the viewport
    And the hamburger menu button should not be visible
    When I tap the back button in the top appbar
    Then the browser URL should be "/home"
    And the page should load without a full page refresh

    Examples:
      | breakpoint   | width  |
      | mobile       | 375px  |
      | tablet       | 768px  |
      | large tablet | 1024px |

  # =============================================================================
  # Scenario Group: Desktop Header
  # =============================================================================

  Scenario Outline: TAB-03: Desktop top appbar shows page title derived from the current route
    Given the browser viewport is 1280px
    When I navigate to the "<route>" page
    Then the desktop top appbar should be visible
    And the desktop top appbar should display the page title "<title>"
    And the top appbar should be sticky
    And the hamburger menu button should not be visible
    And the back button should not be visible
    And the sidebar should be visible
    And the desktop top appbar should not overlap the sidebar

    Examples:
      | route     | title          |
      | /home     | Home           |
      | /forecast | 7-Day Forecast |

  # =============================================================================
  # Scenario Group: Responsive Transitions
  # =============================================================================

  Scenario Outline: TAB-04: Top appbar transitions between mobile and desktop layout on viewport resize from <route>
    Given the browser viewport is <fromWidth>
    When I navigate to the "<route>" page
    Then the top appbar <shouldFromAppLogo> display the app logo
    And the top appbar should display the app name "<fromTitle>"
    And the hamburger menu button <shouldFromHamburger> be visible
    And the back button <shouldFromBackButton> be visible
    When I resize the viewport to desktop width <toWidth>
    Then the top appbar <shouldToAppLogo> display the app logo
    And the top appbar should display the app name "<toTitle>"
    And the hamburger menu button <shouldToHamburger> be visible
    And the back button <shouldToBackButton> be visible

    Examples:
      | route     | fromWidth | toWidth | fromTitle          | toTitle            | shouldFromAppLogo | shouldToAppLogo | shouldFromHamburger | shouldToHamburger | shouldFromBackButton | shouldToBackButton |
      | /home     | 375px     | 1280px  | Better Weather for | Home               | should            | should not      | should              | should not        | should not           | should not         |
      | /home     | 1024px    | 1280px  | Better Weather for | Home               | should            | should not      | should              | should not        | should not           | should not         |
      | /home     | 1280px    | 375px   | Home               | Better Weather for | should not        | should          | should not          | should            | should not           | should not         |
      | /forecast | 375px     | 1280px  | 7-Day Forecast     | 7-Day Forecast     | should not        | should not      | should not          | should not        | should               | should not         |
      | /forecast | 1024px    | 1280px  | 7-Day Forecast     | 7-Day Forecast     | should not        | should not      | should not          | should not        | should               | should not         |
      | /forecast | 1280px    | 375px   | 7-Day Forecast     | 7-Day Forecast     | should not        | should not      | should not          | should not        | should not           | should             |

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: TAB-05: Hamburger menu button is keyboard accessible on mobile /home
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I use Tab to navigate to the hamburger menu button
    Then the hamburger menu button should receive focus
    When I press Enter on the focused hamburger menu button
    Then the sidebar should be visible

  Scenario: TAB-06: Back button is keyboard accessible on mobile /forecast
    Given the browser viewport is 375px
    When I navigate to the "/forecast" page
    And I use Tab to navigate to the back button
    Then the back button should receive focus
    When I press Enter on the focused back button
    Then the browser URL should be "/home"
