Feature: Community Links
  As a user
  I want to see Ko-fi and Discord community links in the sidebar
  So that I can support the project and join the community

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Community Links Display
  # =============================================================================

  Scenario: CL-01: Community links are visible in the sidebar on mobile
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the sidebar should display the following community links:
      | label              | icon    |
      | Buy me a coffee    | Ko-fi   |
      | Join our Discord   | Discord |
    And the community links should be positioned below the primary navigation
    When I tap the "Buy me a coffee" community link
    Then the sidebar should remain visible
    And "https://ko-fi.com/P5P414B69G" should be opened in a new browser tab
    When I tap the "Join our Discord" community link
    Then the sidebar should remain visible
    And "https://discord.gg/Ve3TeBqZQ7" should be opened in a new browser tab

  Scenario: CL-02: Community links are visible in the sidebar on desktop
    Given the browser viewport is 1280px
    When I navigate to the "/home" page
    Then the sidebar should be visible
    And the sidebar should display the following community links:
      | label              | icon    |
      | Buy me a coffee    | Ko-fi   |
      | Join our Discord   | Discord |
    And the community links should be positioned below the primary navigation
    And the "Buy me a coffee" community link should have href "https://ko-fi.com/P5P414B69G"
    And the "Buy me a coffee" community link should have target "_blank"
    And the "Buy me a coffee" community link should have rel "noopener noreferrer"
    And the "Join our Discord" community link should have href "https://discord.gg/Ve3TeBqZQ7"
    And the "Join our Discord" community link should have target "_blank"
    And the "Join our Discord" community link should have rel "noopener noreferrer"

  # =============================================================================
  # Scenario Group: Keyboard Accessibility
  # =============================================================================

  Scenario: CL-03: Community links are keyboard navigable
    Given the browser viewport is 375px
    When I navigate to the "/home" page
    And I open the sidebar
    Then the sidebar should be visible
    When I use Tab to navigate past the primary navigation links
    Then focus should move through each community link in order: Buy me a coffee, Join our Discord
    And I should be able to activate a focused community link by pressing Enter
