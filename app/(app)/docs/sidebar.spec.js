import { expect, test } from '@playwright/test';

// ============================================================
// Helper Functions
// ============================================================

// Background: Given the application is running
// (no special setup needed - app runs at localhost:3000)

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Sidebar Navigation', () => {
  test('SB-01: Sidebar contains header and navigation links with icons', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the sidebar should not be visible
    await expect(page.getByTestId('app-sidebar')).toHaveCount(0);

    // When I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then a semi-transparent backdrop should be visible behind the sidebar
    await expect(page.locator('[data-slot="sheet-overlay"]')).toBeVisible();

    // And the sidebar header should display the app logo
    await expect(
      page.locator('[data-slot="sidebar-header"]').getByTestId('app-logo')
    ).toBeVisible();

    // And the sidebar header should display the app name "Better Weather for"
    await expect(page.getByTestId('app-sidebar-name')).toHaveText('Better Weather for');

    // And the sidebar footer should contain "Version"
    await expect(page.getByTestId('app-sidebar-footer')).toContainText('Version');

    // And the sidebar should display the following navigation items:
    // | label           | icon     |
    // | Home            | House    |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).locator('svg.lucide-house')
    ).toBeVisible();

    // | 7-Day Forecast  | Calendar |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).locator('svg.lucide-calendar')
    ).toBeVisible();

    // | Settings        | Settings |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' }).locator('svg.lucide-settings')
    ).toBeVisible();

    // | About           | Info     |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' }).locator('svg.lucide-info')
    ).toBeVisible();

    // When I tap the backdrop overlay
    await page.locator('[data-slot="sheet-overlay"]').click({ position: { x: 330, y: 400 }, force: true });

    // Then the sidebar should close
    await expect(page.locator('[data-slot="sidebar"][role="dialog"]')).toBeHidden();

    // And the backdrop should no longer be visible
    await expect(page.locator('[data-slot="sheet-overlay"]')).toBeHidden();

    // When I open the sidebar again
    await page.getByTestId('app-sidebar-trigger').click();

    // And I tap the close button in the sidebar header
    await page.getByTestId('app-sidebar-close-button').click();

    // Then the sidebar should close
    await expect(page.locator('[data-slot="sidebar"][role="dialog"]')).toBeHidden();
  });

  test('SB-02: Desktop sidebar contains header and navigation links with icons', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And there should be no backdrop overlay
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);

    // And there should be no sidebar trigger button visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the sidebar header should not contain a close button
    await expect(page.getByTestId('app-sidebar-close-button')).toBeHidden();

    // And the sidebar header should display the app logo
    await expect(page.getByTestId('app-logo')).toBeVisible();

    // And the sidebar header should display the app name "Better Weather for"
    await expect(page.getByTestId('app-sidebar-name')).toHaveText('Better Weather for');

    // And the sidebar footer should contain "Version"
    await expect(page.getByTestId('app-sidebar-footer')).toContainText('Version');

    // And the sidebar should display the following navigation items:
    // | label           | icon     |
    // | Home            | House    |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).locator('svg.lucide-house')
    ).toBeVisible();

    // | 7-Day Forecast  | Calendar |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).locator('svg.lucide-calendar')
    ).toBeVisible();

    // | Settings        | Settings |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' }).locator('svg.lucide-settings')
    ).toBeVisible();

    // | About           | Info     |
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' }).locator('svg.lucide-info')
    ).toBeVisible();
  });

  test('SB-03a: Active route highlighted - /home (mobile)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the "Home" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'true');

    // And the other navigation items should not be highlighted
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' })
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-03b: Active route highlighted - /forecast (mobile)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/forecast" page
    await page.goto('http://localhost:3000/forecast');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the "7-Day Forecast" navigation item should be highlighted as active
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' })
    ).toHaveAttribute('data-active', 'true');

    // And the other navigation items should not be highlighted
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' })
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-04a: Active route highlighted - /home (desktop)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

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
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' })
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-04b: Active route highlighted - /forecast (desktop)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/forecast" page
    await page.goto('http://localhost:3000/forecast');

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
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Settings' })
    ).toHaveAttribute('data-active', 'false');
    await expect(
      page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'About' })
    ).toHaveAttribute('data-active', 'false');
  });

  test('SB-05a: Navigate from /home to /forecast (mobile)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB05_NAV_MARKER__ = true; });

    // When I tap the "7-Day Forecast" navigation link
    await page.getByRole('link', { name: '7-Day Forecast' }).click();

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // And the browser URL should be "/forecast"
    await expect(page).toHaveURL('http://localhost:3000/forecast');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB05_NAV_MARKER__ === true)).toBe(true);
  });

  test('SB-05b: Navigate from /forecast to /home (mobile)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/forecast" page
    await page.goto('http://localhost:3000/forecast');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB05_NAV_MARKER__ = true; });

    // When I tap the "Home" navigation link
    await page.getByRole('link', { name: 'Home' }).click();

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // And the browser URL should be "/home"
    await expect(page).toHaveURL('http://localhost:3000/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__SB05_NAV_MARKER__ === true)).toBe(true);
  });

  test('SB-06a: Navigate from /home to /forecast (desktop)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB06_NAV_MARKER__ = true; });

    // When I click the "7-Day Forecast" menu button in the sidebar
    await page.getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).click();

    // Then the browser URL should be "/forecast"
    await expect(page).toHaveURL('http://localhost:3000/forecast');

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
    await page.goto('http://localhost:3000/forecast');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__SB06_NAV_MARKER__ = true; });

    // When I click the "Home" menu button in the sidebar
    await page.getByTestId('app-sidebar-menu-button').filter({ hasText: 'Home' }).click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('http://localhost:3000/home');

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
    await page.goto('http://localhost:3000/home');

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
    await page.goto('http://localhost:3000/home');

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
    await page.goto('http://localhost:3000/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should open
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // When I press the Escape key
    await page.keyboard.press('Escape');

    // Then the sidebar should close
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeHidden();

    // When I open the sidebar again
    await page.getByTestId('app-sidebar-trigger').click();
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();

    // And I use Tab to navigate through sidebar items
    // Then focus should move through each navigation link in order: Home, 7-Day Forecast, Settings, About

    // Focus starts on close button, Tab to first nav link
    await page.getByTestId('app-sidebar-close-button').focus();
    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Home');

    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('7-Day Forecast');

    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('Settings');

    await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.activeElement?.textContent?.trim())).toBe('About');

    // And I should be able to activate a focused link by pressing Enter
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/about/);
  });
});
