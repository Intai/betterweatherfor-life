Feature: Sidebar Navigation
  As a user
  I want a navigation system that shows a hamburger menu on mobile/tablet and a persistent sidebar on desktop
  So that I can easily navigate between Home, 7-Day Forecast, and City pages from any screen size

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Sidebar Header and Navigation Links
  # =============================================================================

  Scenario: SB-01: Sidebar contains header and navigation links with icons
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    Then the sidebar should not be visible
    When I open the sidebar
    Then a semi-transparent backdrop should be visible behind the sidebar
    And the sidebar header should display the app logo
    And the sidebar header should display the app name "Better Weather for"
    And the sidebar footer should contain "Version"
    And the sidebar should display the following navigation items:
      | label           | icon     |
      | Home            | House    |
      | 7-Day Forecast  | Calendar |
    When I tap the backdrop overlay
    Then the sidebar should close
    And the backdrop should no longer be visible
    When I open the sidebar again
    And I tap the close button in the sidebar header
    Then the sidebar should close

  Scenario: SB-02: Desktop sidebar contains header and and navigation links with icons
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    Then the sidebar should be visible
    And there should be no backdrop overlay
    And there should be no sidebar trigger button visible
    And the sidebar header should not contain a close button
    And the sidebar header should display the app logo
    And the sidebar header should display the app name "Better Weather for"
    And the sidebar footer should contain "Version"
    And the sidebar should display the following navigation items:
      | label           | icon     |
      | Home            | House    |
      | 7-Day Forecast  | Calendar |

  # =============================================================================
  # Scenario Group: Active Route Highlighting
  # =============================================================================

  Scenario: SB-03: Active route is highlighted in the sidebar on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the "Home" navigation item should be highlighted as active
    And the other navigation items should not be highlighted

  Scenario Outline: SB-04: Active route is highlighted in the sidebar on desktop
    Given the browser viewport is 1280px
    When I navigate to the "<route>" page
    Then the sidebar should be visible
    And the "<label>" navigation item should be highlighted as active
    And the other navigation items should not be highlighted

    Examples:
      | route     | label          |
      | /home     | Home           |
      | /forecast | 7-Day Forecast |

  # =============================================================================
  # Scenario Group: Client-Side Navigation
  # =============================================================================

  Scenario: SB-05: Navigating to pages via sidebar links on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the sidebar should be visible
    When I tap the "7-Day Forecast" navigation link
    Then the sidebar should close
    And the browser URL should be "/forecast"
    And the page should load without a full page refresh
    When I tap the back button in the top appbar
    Then the browser URL should be "/home"
    And the page should load without a full page refresh

  Scenario Outline: SB-06: Navigating to pages via sidebar links on desktop
    Given the browser viewport is 1280px
    When I navigate to the "<from>" page
    Then the sidebar should be visible
    When I click the "<label>" menu button in the sidebar
    Then the browser URL should be "<to>"
    And the page should load without a full page refresh
    And the "<label>" navigation item should be highlighted as active

    Examples:
      | label          | from      | to        |
      | 7-Day Forecast | /home     | /forecast |
      | Home           | /forecast | /home     |

  # =============================================================================
  # Scenario Group: Responsive Breakpoint Transitions
  # =============================================================================

  Scenario: SB-07: Sidebar transitions from mobile to desktop on viewport resize
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    Then the sidebar should not be visible
    And the sidebar trigger button should be visible in the header
    When I resize the viewport to desktop width 1280px
    Then the sidebar should become persistently visible
    And the sidebar trigger button should no longer be visible

  Scenario: SB-08: Sidebar transitions from desktop to mobile on viewport resize
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    And the sidebar is persistently visible
    And the sidebar trigger button should not be visible in the header
    When I resize the viewport to mobile width 375px
    Then the sidebar should no longer be visible
    And the sidebar trigger button should be visible in the header

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: SB-09: Sidebar navigation items are keyboard navigable
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the sidebar should be visible
    When I press the Escape key
    Then the sidebar should close
    When I open the sidebar again
    And I use Tab to navigate through sidebar items
    Then focus should move through each navigation links in order: Home, 7-Day Forecast
    And I should be able to activate a focused link by pressing Enter
