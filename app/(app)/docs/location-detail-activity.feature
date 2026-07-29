Feature: Location Detail Activity Naming
  As an outdoor enthusiast
  I want the location detail page to name the activity its forecast is tailored to
  So that I can tell whether the conditions shown are for SUP, kayaking, snorkelling, or cycling

  Background:
    Given the application is running
    And the database is seeded with the default locations and forecasts
    And the following locations have forecasts tailored to a single activity:
      | activity    | activityLabel | name        | url                                     |
      | sup         | SUP           | Mission Bay | /location/mission-bay/-36.8547,174.8317 |
      | kayaking    | Kayaking      | Bondi Beach | /location/bondi-beach/-33.8915,151.2767 |
      | snorkelling | Snorkelling   | Goat Island | /location/goat-island/-36.2675,174.7936 |
      | cycling     | Cycling       | Piha Beach  | /location/piha-beach/-36.9553,174.4681  |

  # =============================================================================
  # Scenario Group: Conditions Heading Names the Selected Activity
  # =============================================================================

  @purge-data @screenshots
  Scenario Outline: LDA-01: Conditions heading names the <activityLabel> activity the forecast is tailored to
    Given the browser viewport is 375px
    And the browser cookie "selectedActivity" is set to "<activity>" in context
    When I navigate to the "<url>" page
    Then the conditions section should be visible
    And the heading "Conditions for <activityLabel>" should be visible in the conditions section
    And the heading should use the localized "home.activities.<activity>" label "<activityLabel>" for the activity name
    And the plain heading "Conditions" without an activity name should not be visible

    Examples:
      | activity    | activityLabel | url                                     |
      | sup         | SUP           | /location/mission-bay/-36.8547,174.8317 |
      | kayaking    | Kayaking      | /location/bondi-beach/-33.8915,151.2767 |
      | snorkelling | Snorkelling   | /location/goat-island/-36.2675,174.7936 |
      | cycling     | Cycling       | /location/piha-beach/-36.9553,174.4681  |

  # =============================================================================
  # Scenario Group: Conditions Heading Reacts to the Forecast Store Selection
  # =============================================================================

  Scenario: LDA-02: Conditions heading updates when the selected activity changes in the forecast store
    Given the browser viewport is 375px
    # SUP is the selected activity in the forecast store
    And the browser cookie "selectedActivity" is set to "sup" in context
    When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    Then the heading "Conditions for SUP" should be visible in the conditions section

    # The selected activity in the forecast store changes to Cycling
    When the browser cookie "selectedActivity" is set to "cycling" in context
    And I navigate to the "/location/piha-beach/-36.9553,174.4681" page
    Then the heading "Conditions for Cycling" should be visible in the conditions section
    And the heading "Conditions for SUP" should not be visible

    # The selected activity in the forecast store changes again to Snorkelling
    When the browser cookie "selectedActivity" is set to "snorkelling" in context
    And I navigate to the "/location/goat-island/-36.2675,174.7936" page
    Then the heading "Conditions for Snorkelling" should be visible in the conditions section
    And the heading "Conditions for Cycling" should not be visible

  # =============================================================================
  # Scenario Group: Score Card Best-Conditions Line Has No Activity Name
  # =============================================================================

  Scenario Outline: LDA-03: Score card best-conditions line stays free of an activity name for <name>
    Given the browser viewport is <width>
    And the browser cookie "selectedActivity" is set to "<activity>" in context
    When I navigate to the "<url>" page
    Then the score card best-hour line should be visible
    And the score card best-hour line should read "<bestHour>"
    And the score card best-hour line should not contain the activity name "<activityLabel>"

    Examples:
      | width  | activity | activityLabel | name        | url                                        | bestHour                   |
      | 768px  | sup      | SUP           | Mission Bay | /location/mission-bay/-36.8547,174.8317    | Best conditions at 09:00   |
      | 1024px | sup      | SUP           | St Heliers  | /location/st-heliers-bay/-36.8508,174.8593 | Better conditions at 06:00 |
      | 1280px | cycling  | Cycling       | Piha Beach  | /location/piha-beach/-36.9553,174.4681     | Better conditions at 19:00 |
