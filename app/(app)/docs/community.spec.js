import { expect, test } from '@playwright/test';

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Community Links', () => {
  test('CL-01: Community links are visible in the sidebar on mobile', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should display the following community links:
    // | label              | icon    |
    // | Buy me a coffee    | Ko-fi   |
    // | Join our Discord   | Discord |
    const buyMeACoffeeLink = page.getByRole('dialog').getByRole('link', { name: 'Buy me a coffee' });
    await expect(buyMeACoffeeLink).toBeVisible();
    await expect(buyMeACoffeeLink.getByTestId('kofi-logo')).toBeVisible();

    const joinDiscordLink = page.getByRole('dialog').getByRole('link', { name: 'Join our Discord' });
    await expect(joinDiscordLink).toBeVisible();
    await expect(joinDiscordLink.getByTestId('discord-logo')).toBeVisible();

    // And the community links should be positioned below the primary navigation
    const navList = page.getByRole('dialog').getByRole('list').first();
    const communityList = page.getByRole('dialog').getByRole('list').last();
    const navBox = await navList.boundingBox();
    const communityBox = await communityList.boundingBox();
    expect(communityBox.y).toBeGreaterThan(navBox.y + navBox.height);

    // When I tap the "Buy me a coffee" community link
    const [kofiPage] = await Promise.all([
      context.waitForEvent('page'),
      buyMeACoffeeLink.click(),
    ]);

    // Then the sidebar should remain visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // And "https://ko-fi.com/P5P414B69G" should be opened in a new browser tab
    expect(kofiPage.url()).toBe('https://ko-fi.com/P5P414B69G');

    // When I tap the "Join our Discord" community link
    const [discordPage] = await Promise.all([
      context.waitForEvent('page'),
      joinDiscordLink.click(),
    ]);

    // Then the sidebar should remain visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // And "https://discord.gg/Ve3TeBqZQ7" should be opened in a new browser tab
    expect(discordPage.url()).toContain('discord');
    expect(discordPage.url()).toContain('Ve3TeBqZQ7');
  });

  test('CL-02: Community links are visible in the sidebar on desktop @prod @smoke', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // Then the sidebar should be visible
    await expect(page.getByTestId('app-sidebar')).toBeVisible();

    // And the sidebar should display the following community links:
    // | label              | icon    |
    // | Buy me a coffee    | Ko-fi   |
    // | Join our Discord   | Discord |
    const buyMeACoffeeLink = page.getByTestId('app-sidebar').getByRole('link', { name: 'Buy me a coffee' });
    await expect(buyMeACoffeeLink).toBeVisible();
    await expect(buyMeACoffeeLink.getByTestId('kofi-logo')).toBeVisible();

    const joinDiscordLink = page.getByTestId('app-sidebar').getByRole('link', { name: 'Join our Discord' });
    await expect(joinDiscordLink).toBeVisible();
    await expect(joinDiscordLink.getByTestId('discord-logo')).toBeVisible();

    // And the community links should be positioned below the primary navigation
    const navList = page.getByTestId('app-sidebar').getByRole('list').first();
    const communityList = page.getByTestId('app-sidebar').getByRole('list').last();
    const navBox = await navList.boundingBox();
    const communityBox = await communityList.boundingBox();
    expect(communityBox.y).toBeGreaterThan(navBox.y + navBox.height);

    // And the "Buy me a coffee" community link should have href "https://ko-fi.com/P5P414B69G"
    await expect(buyMeACoffeeLink).toHaveAttribute('href', 'https://ko-fi.com/P5P414B69G');

    // And the "Buy me a coffee" community link should have target "_blank"
    await expect(buyMeACoffeeLink).toHaveAttribute('target', '_blank');

    // And the "Buy me a coffee" community link should have rel "noopener noreferrer"
    await expect(buyMeACoffeeLink).toHaveAttribute('rel', 'noopener noreferrer');

    // And the "Join our Discord" community link should have href "https://discord.gg/Ve3TeBqZQ7"
    await expect(joinDiscordLink).toHaveAttribute('href', 'https://discord.gg/Ve3TeBqZQ7');

    // And the "Join our Discord" community link should have target "_blank"
    await expect(joinDiscordLink).toHaveAttribute('target', '_blank');

    // And the "Join our Discord" community link should have rel "noopener noreferrer"
    await expect(joinDiscordLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('CL-03: Community links are keyboard navigable', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('/home');

    // And I open the sidebar
    await page.getByTestId('app-sidebar-trigger').click();

    // Then the sidebar should be visible
    await expect(page.getByRole('dialog')).toBeVisible();

    // When I use Tab to navigate past the primary navigation links
    await page.keyboard.press('Tab'); // Close menu -> Home
    await page.keyboard.press('Tab'); // Home -> 7-Day Forecast
    await page.keyboard.press('Tab'); // 7-Day Forecast -> Cities
    await page.keyboard.press('Tab'); // Cities -> Buy me a coffee

    // Then focus should move through each community link in order: Buy me a coffee, Join our Discord
    const buyMeACoffeeLink = page.getByRole('dialog').getByRole('link', { name: 'Buy me a coffee' });
    const joinDiscordLink = page.getByRole('dialog').getByRole('link', { name: 'Join our Discord' });
    await expect(buyMeACoffeeLink).toBeFocused();

    await page.keyboard.press('Tab'); // Buy me a coffee -> Join our Discord
    await expect(joinDiscordLink).toBeFocused();

    // And I should be able to activate a focused community link by pressing Enter
    await page.keyboard.press('Shift+Tab'); // Back to Buy me a coffee
    await expect(buyMeACoffeeLink).toBeFocused();

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.keyboard.press('Enter'),
    ]);
    expect(newPage.url()).toBe('https://ko-fi.com/P5P414B69G');
  });
});
