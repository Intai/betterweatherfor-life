import { expect, test } from '@playwright/test';

// ============================================================
// Helper Functions
// ============================================================

// Background: Given the application is running
// (no special setup needed - navigations resolve against use.baseURL)

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Sidebar Navigation', () => {
  test('SB-01: Sidebar contains header and navigation links with icons', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should not be visible
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

    // When I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then a semi-transparent backdrop should be visible behind the sidebar
    await expect(page.locator('[data-slot="sheet-overlay"]')).toBeVisible();

    // And the sidebar header should display the app logo
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-logo')
    ).toBeVisible();

    // And the sidebar header should display the app name "Better Weather for"
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-name')
    ).toContainText('Better Weather for');

    // And the sidebar footer should contain "Version"
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-footer')
    ).toContainText('Version');

    // And the sidebar should display the following navigation items:
    // | label           | icon     |
    // | Home            | House    |
    // | 7-Day Forecast  | Calendar |
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).locator('svg.lucide-house')
    ).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toBeVisible();
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).locator('svg.lucide-calendar')
    ).toBeVisible();

    // When I tap the backdrop overlay
    await page.locator('[data-slot="sheet-overlay"]').click({ force: true });

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // And the backdrop should no longer be visible
    await expect(page.locator('[data-slot="sheet-overlay"]')).toBeHidden();

    // When I open the sidebar again
    await page.getByTestId('app-sidebar-trigger').click();

    // And I tap the close button in the sidebar header
    await page.getByTestId('app-sidebar-close-button').click();

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();
  });

  test('SB-02: Desktop sidebar contains header and navigation links with icons', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And there should be no backdrop overlay
    await expect(page.locator('[data-slot="sheet-overlay"]')).toHaveCount(0);

    // And there should be no sidebar trigger button visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the sidebar header should not contain a close button
    await expect(page.getByTestId('app-sidebar-close-button')).toBeHidden();

    // And the sidebar header should display the app logo
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-logo')
    ).toBeVisible();

    // And the sidebar header should display the app name "Better Weather for"
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-name')
    ).toContainText('Better Weather for');

    // And the sidebar footer should contain "Version"
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-footer')
    ).toContainText('Version');

    // And the sidebar should display the following navigation items:
    // | label           | icon     |
    // | Home            | House    |
    // | 7-Day Forecast  | Calendar |
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toBeVisible();
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).locator('svg.lucide-house')
    ).toBeVisible();
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toBeVisible();
    await expect(
      page.getByTestId('app-sidebar').getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).locator('svg.lucide-calendar')
    ).toBeVisible();
  });

  test('SB-03: Active route is highlighted in the sidebar on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the "Home" navigation item should be highlighted as active
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'true');

    // And the other navigation items should not be highlighted
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-cities-trigger')
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-04a: Active route is highlighted on desktop (/home → Home)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the "Home" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'true');

    // And the other navigation items should not be highlighted
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-cities-trigger')
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-04b: Active route is highlighted on desktop (/forecast → 7-Day Forecast)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the "7-Day Forecast" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'true');

    // And the other navigation items should not be highlighted
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-cities-trigger')
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-05: Navigating to pages via sidebar links on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB05_NAV_MARKER__ = true; });

    // When I tap the "7-Day Forecast" navigation link
    await page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).click();

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // And the browser URL should be "/forecast"
    await expect(page).toHaveURL('/forecast');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB05_NAV_MARKER__ === true)).toBe(true);

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB05_NAV_MARKER__ === true)).toBe(true);
  });

  test('SB-06a: Navigate from /home to /forecast (desktop)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB06_NAV_MARKER__ = true; });

    // When I click the "7-Day Forecast" menu button in the sidebar
    await page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).click();

    // Then the browser URL should be "/forecast"
    await expect(page).toHaveURL('/forecast');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB06_NAV_MARKER__ === true)).toBe(true);

    // And the "7-Day Forecast" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'true');
  });

  test('SB-06b: Navigate from /forecast to /home (desktop)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB06_NAV_MARKER__ = true; });

    // When I click the "Home" menu button in the sidebar
    await page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB06_NAV_MARKER__ === true)).toBe(true);

    // And the "Home" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'true');
  });

  test('SB-07: Sidebar transitions from mobile to desktop on viewport resize', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should not be visible
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

    // When I resize the viewport to desktop width 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // Then the sidebar should become persistently visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the sidebar trigger button should no longer be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();
  });

  test('SB-08: Sidebar transitions from desktop to mobile on viewport resize', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And the sidebar is persistently visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the sidebar trigger button should not be visible in the header
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // When I resize the viewport to mobile width 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Then the sidebar should no longer be visible
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

    // And the sidebar trigger button should be visible in the header
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();
  });

  test('SB-09: Sidebar navigation items are keyboard navigable', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // When I press the Escape key
    await page.keyboard.press('Escape');

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // When I open the sidebar again
    await page.getByTestId('app-sidebar-trigger').click();

    // And I use Tab to navigate through sidebar items
    // Then focus should move through each navigation links in order: Home, 7-Day Forecast
    await page.keyboard.press('Tab');
    expect(await page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).evaluate(
      (el) => el === document.activeElement
    )).toBe(true);

    await page.keyboard.press('Tab');
    expect(await page.getByRole('dialog', { name: 'Sidebar' }).getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).evaluate(
      (el) => el === document.activeElement
    )).toBe(true);

    // And I should be able to activate a focused link by pressing Enter
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('/forecast');
  });
});
