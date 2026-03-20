import { expect, test } from '@playwright/test'

// ============================================================
// Helper Functions
// ============================================================

const expectedNavItems = [
  { label: 'Home', icon: 'lucide-house' },
  { label: '7-Day Forecast', icon: 'lucide-calendar' },
  { label: 'Cities', icon: 'lucide-globe' },
  { label: 'Settings', icon: 'lucide-settings' },
  { label: 'About', icon: 'lucide-info' },
]

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Cities in Sidebar', () => {
  test('CT-01: Cities collapsible menu item is displayed between 7-Day Forecast and Settings on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click()

    // Then the sidebar should display the following navigation items in order
    const sidebar = page.getByRole('dialog', { name: 'Sidebar' })
    await expect(sidebar).toBeVisible()

    const items = sidebar.locator('li')
    await expect(items).toHaveCount(expectedNavItems.length)

    const navItems = await items.evaluateAll((els) =>
      els.map((li) => {
        const link = li.querySelector('a, button')
        const text = link ? link.textContent.trim() : ''
        const svgs = li.querySelectorAll('svg')
        const icon = Array.from(svgs)
          .map((s) => Array.from(s.classList).find((c) => c.startsWith('lucide-')))
          .find(Boolean)
        return { label: text, icon: icon || '' }
      }),
    )

    expect(navItems).toEqual(expectedNavItems)

    // And the "Cities" menu item should display a ChevronRight icon
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await expect(citiesTrigger).toBeVisible()
    const hasChevron = await citiesTrigger.evaluate((el) =>
      !!el.querySelector('.lucide-chevron-right'),
    )
    expect(hasChevron).toBe(true)

    // And the "Cities" section should be collapsed
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('CT-02: Cities collapsible menu item is displayed between 7-Day Forecast and Settings on desktop', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // Then the sidebar should be visible
    const sidebar = page.getByTestId('app-sidebar')
    await expect(sidebar).toBeVisible()

    // And the sidebar should display the following navigation items in order
    const items = sidebar.locator('li')
    await expect(items).toHaveCount(expectedNavItems.length)

    const navItems = await items.evaluateAll((els) =>
      els.map((li) => {
        const link = li.querySelector('a, button')
        const text = link ? link.textContent.trim() : ''
        const svgs = li.querySelectorAll('svg')
        const icon = Array.from(svgs)
          .map((s) => Array.from(s.classList).find((c) => c.startsWith('lucide-')))
          .find(Boolean)
        return { label: text, icon: icon || '' }
      }),
    )

    expect(navItems).toEqual(expectedNavItems)

    // And the "Cities" menu item should display a ChevronRight icon
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await expect(citiesTrigger).toBeVisible()
    const hasChevron = await citiesTrigger.evaluate((el) =>
      !!el.querySelector('.lucide-chevron-right'),
    )
    expect(hasChevron).toBe(true)

    // And the "Cities" section should be collapsed
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'false')
  })

  test('CT-03: Expanding Cities reveals city items with MapPin icons on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click()

    // And I tap the "Cities" menu item
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await citiesTrigger.click()

    // Then the "Cities" section should be expanded
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the ChevronRight icon on "Cities" should be rotated 90 degrees
    const hasRotate90 = await citiesTrigger.locator('.lucide-chevron-right').evaluate((el) =>
      el.classList.contains('rotate-90'),
    )
    expect(hasRotate90).toBe(true)

    // And the city items should be indented under the "Cities" menu item
    const cityItems = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city')
    await expect(cityItems).toHaveCount(2)

    // And each city item should display a MapPin icon, the city name, and a ChevronRight icon
    const cityData = await cityItems.evaluateAll((els) =>
      els.map((el) => {
        const button = el.querySelector('[data-testid="app-sidebar-city-trigger"]')
        const icons = button
          ? Array.from(button.querySelectorAll('svg')).map((svg) =>
              Array.from(svg.classList).find((c) => c.startsWith('lucide-')),
            )
          : []
        const name = button ? button.textContent.trim() : ''
        return { name, icons }
      }),
    )

    for (const city of cityData) {
      expect(city.icons).toContain('lucide-map-pin')
      expect(city.icons).toContain('lucide-chevron-right')
      expect(city.name).toBeTruthy()
    }

    // When I tap the "Cities" menu item again
    await citiesTrigger.click()

    // Then the "Cities" section should be collapsed
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'false')

    // And the sidebar should still be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible()
  })

  test('CT-04: Expanding Cities reveals city items with MapPin icons on desktop', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I click the "Cities" menu item in the sidebar
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await citiesTrigger.click()

    // Then the "Cities" section should be expanded
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the ChevronRight icon on "Cities" should be rotated 90 degrees
    const hasRotate90 = await citiesTrigger.locator('.lucide-chevron-right').evaluate((el) =>
      el.classList.contains('rotate-90'),
    )
    expect(hasRotate90).toBe(true)

    // And the city items should be indented under the "Cities" menu item
    const cityItems = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city')
    await expect(cityItems).toHaveCount(2)

    // And each city item should display a MapPin icon, the city name, and a ChevronRight icon
    const cityData = await cityItems.evaluateAll((els) =>
      els.map((el) => {
        const button = el.querySelector('[data-testid="app-sidebar-city-trigger"]')
        const icons = button
          ? Array.from(button.querySelectorAll('svg')).map((svg) =>
              Array.from(svg.classList).find((c) => c.startsWith('lucide-')),
            )
          : []
        const name = button ? button.textContent.trim() : ''
        return { name, icons }
      }),
    )

    for (const city of cityData) {
      expect(city.icons).toContain('lucide-map-pin')
      expect(city.icons).toContain('lucide-chevron-right')
      expect(city.name).toBeTruthy()
    }

    // When I click the "Cities" menu item in the sidebar again
    await citiesTrigger.click()

    // Then the "Cities" section should be collapsed
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'false')

    // And the ChevronRight icon on "Cities" should not be rotated
    const hasRotate90After = await citiesTrigger.locator('.lucide-chevron-right').evaluate((el) =>
      el.classList.contains('rotate-90'),
    )
    expect(hasRotate90After).toBe(false)

    // And the city items should not be visible
    await expect(cityItems).toHaveCount(0)
  })

  test('CT-05: Only one city can be expanded at a time (accordion behaviour)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I click the "Cities" menu item in the sidebar
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await citiesTrigger.click()

    // And I click on the first city item
    const firstCityTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await firstCityTrigger.click()

    // Then the first city should be expanded showing sub-nav links "Overview" and "7-Day Forecast"
    await expect(firstCityTrigger).toHaveAttribute('aria-expanded', 'true')
    const firstCityLinks = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link')
    await expect(firstCityLinks).toHaveCount(2)
    await expect(firstCityLinks.first()).toContainText('Overview')
    await expect(firstCityLinks.nth(1)).toContainText('7-Day Forecast')

    // And the sub-nav links should not display any icons
    const hasIcons = await firstCityLinks.evaluateAll((els) =>
      els.some((el) => el.querySelectorAll('svg').length > 0),
    )
    expect(hasIcons).toBe(false)

    // When I click on the second city item
    const secondCityTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').nth(1)
    await secondCityTrigger.click()

    // Then the second city should be expanded showing sub-nav links "Overview" and "7-Day Forecast"
    await expect(secondCityTrigger).toHaveAttribute('aria-expanded', 'true')
    const secondCityLinks = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').nth(1).getByRole('link')
    await expect(secondCityLinks).toHaveCount(2)
    await expect(secondCityLinks.first()).toContainText('Overview')
    await expect(secondCityLinks.nth(1)).toContainText('7-Day Forecast')

    // And the first city should be collapsed
    await expect(firstCityTrigger).toHaveAttribute('aria-expanded', 'false')

    // When I click on the second city item again
    await secondCityTrigger.click()

    // Then the second city should be collapsed
    await expect(secondCityTrigger).toHaveAttribute('aria-expanded', 'false')

    // And no city sub-nav links should be visible
    const allCityLinks = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').getByRole('link')
    await expect(allCityLinks).toHaveCount(0)
  })

  test('CT-06: Clicking a city Overview sub-nav link navigates to the city home page', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // Set SPA navigation marker
    await page.evaluate(() => { window.__SPA_MARKER__ = true })

    // And I click the "Cities" menu item in the sidebar
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await citiesTrigger.click()

    // And I click on the "Auckland" city item
    const aucklandTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await aucklandTrigger.click()

    // And I click the "Overview" sub-nav link under "Auckland"
    const overviewLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: 'Overview' })
    await overviewLink.click()

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/)

    // And the page should load without a full page refresh
    const spaMarkerAfterOverview = await page.evaluate(() => window.__SPA_MARKER__ === true)
    expect(spaMarkerAfterOverview).toBe(true)

    // When I click the "7-Day Forecast" sub-nav link under "Auckland"
    const forecastLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: '7-Day Forecast' })
    await forecastLink.click()

    // Then the browser URL should be "/auckland/forecast"
    await expect(page).toHaveURL(/\/auckland\/forecast/)

    // And the page should load without a full page refresh
    const spaMarkerAfterForecast = await page.evaluate(() => window.__SPA_MARKER__ === true)
    expect(spaMarkerAfterForecast).toBe(true)
  })

  test('CT-07: Clicking a city sub-nav link closes the sidebar drawer on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click()

    // And I tap the "Cities" menu item
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await citiesTrigger.click()

    // And I tap on the "Auckland" city item
    const aucklandTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await aucklandTrigger.click()

    // Then the "Auckland" section should be expanded
    await expect(aucklandTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the sidebar should still be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible()

    // When I tap on the "Auckland" city item again
    await aucklandTrigger.click()

    // Then the "Auckland" section should be collapsed
    await expect(aucklandTrigger).toHaveAttribute('aria-expanded', 'false')

    // And the sidebar should still be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible()

    // When I tap on the "Auckland" city item again
    await aucklandTrigger.click()

    // And I tap the "Overview" sub-nav link under "Auckland"
    const overviewLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: 'Overview' })
    await overviewLink.click()

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden()

    // And the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/)
  })

  test('CT-08a: Active sub-nav link is highlighted based on current route (/auckland/home)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/auckland/home" page
    await page.goto('/auckland/home')

    // Then the "Cities" section should be auto-expanded
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the "Auckland" city should be auto-expanded
    const aucklandTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await expect(aucklandTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the "Overview" sub-nav link under "Auckland" should be highlighted as active
    const overviewLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: 'Overview' })
    await expect(overviewLink).toHaveAttribute('data-active', 'true')

    // And the other sub-nav link should not be highlighted
    const forecastLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: '7-Day Forecast' })
    await expect(forecastLink).toHaveAttribute('data-active', 'false')
  })

  test('CT-08b: Active sub-nav link is highlighted based on current route (/auckland/forecast)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 })

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast')

    // Then the "Cities" section should be auto-expanded
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the "Auckland" city should be auto-expanded
    const aucklandTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await expect(aucklandTrigger).toHaveAttribute('aria-expanded', 'true')

    // And the "7-Day Forecast" sub-nav link under "Auckland" should be highlighted as active
    const forecastLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: '7-Day Forecast' })
    await expect(forecastLink).toHaveAttribute('data-active', 'true')

    // And the other sub-nav link should not be highlighted
    const overviewLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: 'Overview' })
    await expect(overviewLink).toHaveAttribute('data-active', 'false')
  })

  test('CT-09: Cities menu item and city items are keyboard navigable', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 })

    // When I navigate to the "/home" page
    await page.goto('/home')

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click()

    // And I use Tab to navigate to the "Cities" menu item
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Then the "Cities" menu item should receive focus
    const citiesTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-cities-trigger')
    await expect(citiesTrigger).toBeFocused()

    // When I press Enter on the focused "Cities" menu item
    await page.keyboard.press('Enter')

    // Then the "Cities" section should be expanded
    await expect(citiesTrigger).toHaveAttribute('aria-expanded', 'true')

    // When I use Tab to navigate to the first city item
    await page.keyboard.press('Tab')

    // And I press Enter on the focused city item
    const firstCityTrigger = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city-trigger').first()
    await expect(firstCityTrigger).toBeFocused()
    await page.keyboard.press('Enter')

    // Then the first city should be expanded showing sub-nav links
    await expect(firstCityTrigger).toHaveAttribute('aria-expanded', 'true')

    // When I use Tab to navigate to the "Overview" sub-nav link
    await page.keyboard.press('Tab')

    // And I press Enter on the focused "Overview" sub-nav link
    const overviewLink = page.getByTestId('app-sidebar-cities').getByTestId('app-sidebar-city').first().getByRole('link', { name: 'Overview' })
    await expect(overviewLink).toBeFocused()
    await page.keyboard.press('Enter')

    // Then the browser URL should navigate to the city overview page
    await expect(page).toHaveURL(/\/auckland\/home/)
  })
})
