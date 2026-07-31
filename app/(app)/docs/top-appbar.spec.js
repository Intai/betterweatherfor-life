import { expect, test } from '@playwright/test';

// ============================================================
// Helper Functions
// ============================================================

// Background: Given the application is running
// (no special setup needed - navigations resolve against use.baseURL)

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Top Appbar', () => {
  // ===========================================================
  // Scenario Group: Mobile/Tablet Home Header (TAB-01)
  // ===========================================================

  test('TAB-01: Top appbar on /home at mobile shows app logo, app name, and hamburger menu', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the mobile home top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-home')).toBeVisible();

    // And the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible and right-aligned
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-home')).toHaveAttribute('class', /sticky/);

    // When I tap the hamburger menu button in the top appbar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();
  });

  test('TAB-01: Top appbar on /home at tablet shows app logo, app name, and hamburger menu', async ({ page }) => {
    // Given the browser viewport is 768px
    await page.setViewportSize({ width: 768, height: 1024 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the mobile home top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-home')).toBeVisible();

    // And the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible and right-aligned
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-home')).toHaveAttribute('class', /sticky/);

    // When I tap the hamburger menu button in the top appbar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();
  });

  test('TAB-01: Top appbar on /home at large tablet shows app logo, app name, and hamburger menu', async ({ page }) => {
    // Given the browser viewport is 1024px
    await page.setViewportSize({ width: 1024, height: 768 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the mobile home top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-home')).toBeVisible();

    // And the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible and right-aligned
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-home')).toHaveAttribute('class', /sticky/);

    // When I tap the hamburger menu button in the top appbar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();
  });

  // ===========================================================
  // Scenario Group: Mobile/Tablet Forecast Header (TAB-02)
  // ===========================================================

  test('TAB-02: Top appbar on /forecast at mobile shows back button and page title', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the mobile sub-page top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub')).toBeVisible();

    // And the back button should be visible and left-aligned
    const backButton = page.getByTestId('top-appbar-back');
    await expect(backButton).toBeVisible();
    const appbarBox = await page.getByTestId('top-appbar-mobile-sub').boundingBox();
    const backBox = await backButton.boundingBox();
    expect(backBox.x - appbarBox.x).toBeLessThan(30);

    // And the top appbar should display the page title "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-sub')).toHaveAttribute('class', /sticky/);

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toHaveCount(0);

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__TAB02_NAV_MARKER__ = true; });

    // When I tap the back button in the top appbar
    await backButton.click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__TAB02_NAV_MARKER__ === true)).toBe(true);
  });

  test('TAB-02: Top appbar on /forecast at tablet shows back button and page title', async ({ page }) => {
    // Given the browser viewport is 768px
    await page.setViewportSize({ width: 768, height: 1024 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the mobile sub-page top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub')).toBeVisible();

    // And the back button should be visible and left-aligned
    const backButton = page.getByTestId('top-appbar-back');
    await expect(backButton).toBeVisible();
    const appbarBox = await page.getByTestId('top-appbar-mobile-sub').boundingBox();
    const backBox = await backButton.boundingBox();
    expect(backBox.x - appbarBox.x).toBeLessThan(30);

    // And the top appbar should display the page title "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-sub')).toHaveAttribute('class', /sticky/);

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toHaveCount(0);

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__TAB02_NAV_MARKER__ = true; });

    // When I tap the back button in the top appbar
    await backButton.click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__TAB02_NAV_MARKER__ === true)).toBe(true);
  });

  test('TAB-02: Top appbar on /forecast at large tablet shows back button and page title', async ({ page }) => {
    // Given the browser viewport is 1024px
    await page.setViewportSize({ width: 1024, height: 768 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the mobile sub-page top appbar should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub')).toBeVisible();

    // And the back button should be visible and left-aligned
    const backButton = page.getByTestId('top-appbar-back');
    await expect(backButton).toBeVisible();
    const appbarBox = await page.getByTestId('top-appbar-mobile-sub').boundingBox();
    const backBox = await backButton.boundingBox();
    expect(backBox.x - appbarBox.x).toBeLessThan(30);

    // And the top appbar should display the page title "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the top appbar should be sticky at the top of the viewport
    await expect(page.getByTestId('top-appbar-mobile-sub')).toHaveAttribute('class', /sticky/);

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toHaveCount(0);

    // Set navigation marker to verify client-side navigation (no full page refresh)
    await page.evaluate(() => { window.__TAB02_NAV_MARKER__ = true; });

    // When I tap the back button in the top appbar
    await backButton.click();

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');

    // And the page should load without a full page refresh
    expect(await page.evaluate(() => window.__TAB02_NAV_MARKER__ === true)).toBe(true);
  });

  // ===========================================================
  // Scenario Group: Desktop Header (TAB-03)
  // ===========================================================

  test('TAB-03: Desktop top appbar shows page title "Home" on /home', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the desktop top appbar should be visible
    await expect(page.getByTestId('top-appbar-desktop')).toBeVisible();

    // And the desktop top appbar should display the page title "Home"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('Home');

    // And the top appbar should be sticky
    await expect(page.getByTestId('top-appbar-desktop')).toHaveAttribute('class', /sticky/);

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);

    // And the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the desktop top appbar should not overlap the sidebar
    const sidebarBox = await page.getByTestId('app-sidebar').boundingBox();
    const appbarBox = await page.getByTestId('top-appbar-desktop').boundingBox();
    expect(appbarBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width);
  });

  test('TAB-03: Desktop top appbar shows page title "7-Day Forecast" on /forecast', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the desktop top appbar should be visible
    await expect(page.getByTestId('top-appbar-desktop')).toBeVisible();

    // And the desktop top appbar should display the page title "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('7-Day Forecast');

    // And the top appbar should be sticky
    await expect(page.getByTestId('top-appbar-desktop')).toHaveAttribute('class', /sticky/);

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toBeHidden();

    // And the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the desktop top appbar should not overlap the sidebar
    const sidebarBox = await page.getByTestId('app-sidebar').boundingBox();
    const appbarBox = await page.getByTestId('top-appbar-desktop').boundingBox();
    expect(appbarBox.x).toBeGreaterThanOrEqual(sidebarBox.x + sidebarBox.width);
  });

  // ===========================================================
  // Scenario Group: Responsive Transitions (TAB-04)
  // ===========================================================

  test('TAB-04: Top appbar transitions on viewport resize from /home (375px to 1280px)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);

    // When I resize the viewport to desktop width 1280px
    await page.setViewportSize({ width: 1280, height: 812 });

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "Home"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('Home');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);
  });

  test('TAB-04: Top appbar transitions on viewport resize from /home (1024px to 1280px)', async ({ page }) => {
    // Given the browser viewport is 1024px
    await page.setViewportSize({ width: 1024, height: 768 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);

    // When I resize the viewport to desktop width 1280px
    await page.setViewportSize({ width: 1280, height: 768 });

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "Home"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('Home');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);
  });

  test('TAB-04: Top appbar transitions on viewport resize from /home (1280px to 375px)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "Home"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('Home');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);

    // When I resize the viewport to 375px
    await page.setViewportSize({ width: 375, height: 800 });

    // Then the top appbar should display the app logo
    await expect(page.getByTestId('top-appbar-mobile-home').getByTestId('app-logo')).toBeVisible();

    // And the top appbar should display the app name "Better Weather for"
    await expect(page.getByTestId('top-appbar-mobile-home')).toContainText('Better Weather for');

    // And the hamburger menu button should be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeVisible();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toHaveCount(0);
  });

  test('TAB-04: Top appbar transitions on viewport resize from /forecast (375px to 1280px)', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should be visible
    await expect(page.getByTestId('top-appbar-back')).toBeVisible();

    // When I resize the viewport to desktop width 1280px
    await page.setViewportSize({ width: 1280, height: 812 });

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-desktop').getByTestId('app-logo')).toHaveCount(0);

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toBeHidden();
  });

  test('TAB-04: Top appbar transitions on viewport resize from /forecast (1024px to 1280px)', async ({ page }) => {
    // Given the browser viewport is 1024px
    await page.setViewportSize({ width: 1024, height: 768 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should be visible
    await expect(page.getByTestId('top-appbar-back')).toBeVisible();

    // When I resize the viewport to desktop width 1280px
    await page.setViewportSize({ width: 1280, height: 768 });

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-desktop').getByTestId('app-logo')).toHaveCount(0);

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toBeHidden();
  });

  test('TAB-04: Top appbar transitions on viewport resize from /forecast (1280px to 375px)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('top-appbar-desktop').getByTestId('app-logo')).toHaveCount(0);

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-desktop')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should not be visible
    await expect(page.getByTestId('top-appbar-back')).toBeHidden();

    // When I resize the viewport to 375px
    await page.setViewportSize({ width: 375, height: 800 });

    // Then the top appbar should not display the app logo
    await expect(page.getByTestId('app-logo')).toBeHidden();

    // And the top appbar should display the app name "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the hamburger menu button should not be visible
    await expect(page.getByTestId('app-sidebar-trigger')).toBeHidden();

    // And the back button should be visible
    await expect(page.getByTestId('top-appbar-back')).toBeVisible();
  });

  // ===========================================================
  // Scenario Group: Keyboard Accessibility (TAB-05, TAB-06)
  // ===========================================================

  test('TAB-05: Hamburger menu button is keyboard accessible on mobile /home', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I use Tab to navigate to the hamburger menu button
    await page.keyboard.press('Tab');

    // Then the hamburger menu button should receive focus
    await expect(page.getByTestId('app-sidebar-trigger')).toBeFocused();

    // When I press Enter on the focused hamburger menu button
    await page.keyboard.press('Enter');

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog', { name: 'Sidebar' })).toBeVisible();
  });

  test('TAB-06: Back button is keyboard accessible on mobile /forecast', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // And I use Tab to navigate to the back button
    await page.keyboard.press('Tab');

    // Then the back button should receive focus
    await expect(page.getByTestId('top-appbar-back')).toBeFocused();

    // When I press Enter on the focused back button
    await page.keyboard.press('Enter');

    // Then the browser URL should be "/home"
    await expect(page).toHaveURL('/home');
  });
});
