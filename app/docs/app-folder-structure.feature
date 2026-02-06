Feature: App Folder Structure
  As a search engine crawler
  I want marketing pages to be server-side rendered with proper SEO metadata
  So that the website ranks well in search results

  As a user
  I want app pages to be client-side rendered
  So that I get a fast, interactive experience

  As a mobile user
  I want the app to be installable as a PWA
  So that I can access it like a native app

  Background:
    Given the application is running

  # =============================================================================
  # Scenario Group: Marketing Routes - Server-Side Rendered Pages
  # =============================================================================

  Scenario: AFS-01: Landing page is accessible and server-side rendered
    When I navigate to "/"
    Then the page should return status code 200
    And the page title should be "Find Your Perfect Outdoor Day | Better Weather For Life"
    And the page should contain a "description" meta tag with "Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions."
    And the page should contain an "og:title" meta tag with "Find Your Perfect Outdoor Day"
    And the page should contain an "og:description" meta tag with "Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions."
    And the page title and description should be present in the raw server response

  Scenario: AFS-02: About page is accessible and server-side rendered
    When I navigate to "/about"
    Then the page should return status code 200
    And the page title should be "About Us | Better Weather For Life"
    And the page should contain a "description" meta tag with "Learn how Better Weather For Life helps outdoor enthusiasts find the perfect conditions for their activities."
    And the page title and description should be present in the raw server response

  Scenario: AFS-03: Privacy page is accessible and server-side rendered
    When I navigate to "/privacy"
    Then the page should return status code 200
    And the page title should be "Privacy Policy | Better Weather For Life"
    And the page should contain a "description" meta tag with "How Better Weather For Life collects, uses, and protects your personal information."
    And the page title and description should be present in the raw server response

  Scenario Outline: AFS-04: City home page is accessible and server-side rendered
    When I navigate to "/<city>/home"
    Then the page should return status code 200
    And the page title should be "<title>"
    And the page should contain a "description" meta tag with "<description>"
    And the page should contain an "og:title" meta tag with "<og_title>"
    And the page should contain an "og:description" meta tag with "<description>"
    And the page title and description should be present in the raw server response

    Examples:
      | city         | title                                                        | og_title                          | description                                                                                                                 |
      | auckland     | Auckland - Best Outdoor Spots \| Better Weather For Life     | Auckland - Best Outdoor Spots     | Find the best spots for SUP, kayaking, snorkeling, and cycling in Auckland based on current weather and sea conditions.     |
      | wellington   | Wellington - Best Outdoor Spots \| Better Weather For Life   | Wellington - Best Outdoor Spots   | Find the best spots for SUP, kayaking, snorkeling, and cycling in Wellington based on current weather and sea conditions.   |
      | christchurch | Christchurch - Best Outdoor Spots \| Better Weather For Life | Christchurch - Best Outdoor Spots | Find the best spots for SUP, kayaking, snorkeling, and cycling in Christchurch based on current weather and sea conditions. |

  Scenario Outline: AFS-05: City forecast page is accessible and server-side rendered
    When I navigate to "/<city>/forecast"
    Then the page should return status code 200
    And the page title should be "<title>"
    And the page should contain a "description" meta tag with "<description>"
    And the page should contain an "og:title" meta tag with "<og_title>"
    And the page title and description should be present in the raw server response

    Examples:
      | city         | title                                                  | og_title                    | description                                                                              |
      | auckland     | Auckland 7-Day Forecast \| Better Weather For Life     | Auckland 7-Day Forecast     | 7-day weather, tide, and sea conditions forecast for outdoor activities in Auckland.     |
      | wellington   | Wellington 7-Day Forecast \| Better Weather For Life   | Wellington 7-Day Forecast   | 7-day weather, tide, and sea conditions forecast for outdoor activities in Wellington.   |
      | new-plymouth | New Plymouth 7-Day Forecast \| Better Weather For Life | New Plymouth 7-Day Forecast | 7-day weather, tide, and sea conditions forecast for outdoor activities in New Plymouth. |

  Scenario Outline: AFS-06: City location detail page is accessible and server-side rendered
    When I navigate to "/<city>/location/<geolocation>"
    Then the page should return status code 200
    And the page title should be "<title>"
    And the page should contain a "description" meta tag with "<description>"
    And the page should contain an "og:title" meta tag with "<og_title>"
    And the page should contain an "og:description" meta tag with "<description>"
    And the page title and description should be present in the raw server response

    Examples:
      | city     | geolocation   | title                                               | og_title                 | description                                                                   |
      | auckland | -36.84,174.76 | Auckland -36.84%2C174.76 \| Better Weather For Life | Auckland -36.84%2C174.76 | Current weather, tide, and sea conditions for outdoor activities in Auckland. |
      | sydney   | -33.89,151.27 | Sydney -33.89%2C151.27 \| Better Weather For Life   | Sydney -33.89%2C151.27   | Current weather, tide, and sea conditions for outdoor activities in Sydney.   |

  # =============================================================================
  # Scenario Group: App Routes - Client-Side Rendered Pages
  # =============================================================================

  Scenario Outline: AFS-07: App pages are accessible and client-side rendered
    When I navigate to "<route>"
    Then the page should return status code 200
    And the page title should be "Better Weather For Life" in the raw server response

    Examples:
      | route                   |
      | /home                   |
      | /forecast               |
      | /location/-33.89,151.27 |

  # =============================================================================
  # Scenario Group: robots.txt Configuration
  # =============================================================================

  Scenario: AFS-08: robots.txt is accessible
    When I request "/robots.txt"
    Then the response should return status code 200
    And the response content type should be "text/plain"
    And the robots.txt should reference the sitemap at "/sitemap.xml"

  Scenario: AFS-09: robots.txt allows crawling of marketing routes
    When I request "/robots.txt"
    Then the robots.txt should allow crawling of "/"
    And the robots.txt should allow crawling of "/about"
    And the robots.txt should allow crawling of "/privacy"
    And the robots.txt should allow crawling of "/auckland/home"
    And the robots.txt should allow crawling of "/auckland/forecast"
    And the robots.txt should allow crawling of "/auckland/location/"

  Scenario: AFS-10: robots.txt blocks crawling of app routes
    When I request "/robots.txt"
    Then the robots.txt should disallow crawling of "/home"
    And the robots.txt should disallow crawling of "/forecast"
    And the robots.txt should disallow crawling of "/location/"

  # =============================================================================
  # Scenario Group: sitemap.xml Configuration
  # =============================================================================

  Scenario: AFS-11: sitemap.xml is accessible
    When I request "/sitemap.xml"
    Then the response should return status code 200
    And the response content type should be "application/xml"
    And the sitemap should use the sitemap protocol namespace
    And each URL entry should include a "loc" element
    And each URL entry should include a "lastmod" element

  Scenario: AFS-12: sitemap.xml contains marketing routes
    When I request "/sitemap.xml"
    Then the sitemap should contain the URL "/"
    And the sitemap should contain the URL "/about"
    And the sitemap should contain the URL "/privacy"
    And the sitemap should contain the URL "/auckland/home"
    And the sitemap should contain the URL "/auckland/forecase"

  Scenario: AFS-13: sitemap.xml does not contain app routes
    When I request "/sitemap.xml"
    Then the sitemap should not contain the URL "/home"
    And the sitemap should not contain the URL "/forecast"
    And the sitemap should not contain the URL pattern "/location/"

  # =============================================================================
  # Scenario Group: PWA Manifest
  # =============================================================================

  Scenario: AFS-14: manifest.webmanifest contains required PWA fields
    When I request "/manifest.webmanifest"
    Then the response should return status code 200
    And the response content type should be "application/manifest+json"
    And the manifest should contain a "name" field
    And the manifest should contain a "short_name" field
    And the manifest should contain a "description" field
    And the manifest should contain a "start_url" field
    And the manifest should contain a "display" field with value "standalone"
    And the manifest should contain a "background_color" field
    And the manifest should contain a "theme_color" field
    And the manifest should contain an "icons" array
    And each icon should have a valid "src" path
    And each icon should have a "type" field
    And each icon should have a "sizes" field

  # =============================================================================
  # Scenario Group: OpenGraph Image
  # =============================================================================

  Scenario: AFS-15: OpenGraph image is accessible
    When I request "/opengraph-image.png"
    Then the response should return status code 200
    And the response content type should be "image/png"

  Scenario: AFS-16: Marketing pages reference OpenGraph image
    When I navigate to "/"
    Then the page should contain an "og:image" meta tag
    And the "og:image" meta tag should reference a valid image URL for "opengraph-image-*.png"

  # =============================================================================
  # Scenario Group: Error Handling
  # =============================================================================

  Scenario: AFS-17: Non-existent routes return 404
    When I navigate to "/non-existent-page"
    Then the page should return status code 404
    And the page should display a user-friendly 404 message
