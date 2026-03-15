import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

async function setupBackground(page) {
  // Background: Application is running with mock forecast data
  // Default activity SUP, default day Today with All day time range
  await page.goto('http://localhost:3000/auckland/home');
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Home Locations', () => {
  test('LOC-01: Location card displays all required sections', async ({ page }) => {
    // @purge-data - Restore the seed data to initial state
    execSync('make reseed', { stdio: 'inherit' });

    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // Then the location cards should appear in the following order from top to bottom
    await expect(page.getByTestId('location-card')).toHaveCount(3);

    // Position 1: Mission Bay, score 85
    await expect(page.getByTestId('location-card').nth(0).locator('[data-slot="card-title"]')).toHaveText('Mission Bay');
    await expect(page.getByTestId('location-card').nth(0).getByTestId('condition-score')).toContainText('85');

    // Position 2: Takapuna Beach, score 62
    await expect(page.getByTestId('location-card').nth(1).locator('[data-slot="card-title"]')).toHaveText('Takapuna Beach');
    await expect(page.getByTestId('location-card').nth(1).getByTestId('condition-score')).toContainText('62');

    // Position 3: St Heliers Bay, score 58
    await expect(page.getByTestId('location-card').nth(2).locator('[data-slot="card-title"]')).toHaveText('St Heliers Bay');
    await expect(page.getByTestId('location-card').nth(2).getByTestId('condition-score')).toContainText('58');

    // And the card should display the location name "Mission Bay"
    await expect(page.getByTestId('location-card').first().locator('[data-slot="card-title"]')).toHaveText('Mission Bay');

    // And the card should display the area "Beach, Auckland Central"
    await expect(page.getByTestId('location-card').first().locator('[data-slot="card-description"]')).toHaveText('Beach, Auckland Central');

    // And the card should display a remove (x) button
    await expect(page.getByTestId('location-card').first().getByTestId('remove-location-button')).toBeVisible();

    // And the card should display a score bar
    await expect(page.getByTestId('location-card').first().getByTestId('condition-score-bar')).toBeVisible();

    // And the card should display the score label "85"
    await expect(page.getByTestId('location-card').first().getByTestId('condition-score')).toContainText('85');

    // And the card should display the condition badge "Ideal"
    await expect(page.getByTestId('location-card').first().getByTestId('condition-badge')).toHaveText('Ideal');

    // And the card should display a 2x2 conditions grid with Wind, Tide, Water, and Temp
    // Wind: 8km/h NE
    await expect(page.getByTestId('location-card').first().getByTestId('conditions-grid').getByText('8km/h NE')).toBeVisible();

    // Tide: Rising 70%
    await expect(page.getByTestId('location-card').first().getByTestId('conditions-grid').getByText('Rising 70%')).toBeVisible();

    // Water: Green
    await expect(page.getByTestId('location-card').first().getByTestId('conditions-grid').getByText('Green')).toBeVisible();

    // Temp: 22°C
    await expect(page.getByTestId('location-card').first().getByTestId('conditions-grid').getByText('22°C')).toBeVisible();

    // And the card should display the AI summary
    await expect(page.getByTestId('location-card').first().getByText('Light onshore breeze, excellent for paddling this morning.')).toBeVisible();
  });

  // LOC-02 Scenario Outline: Score bar and condition badge colour matches condition level
  const loc02Examples = [
    { location: 'Mission Bay', score: 85, condition: 'Ideal', conditionClass: 'bg-condition-ideal' },
    { location: 'Takapuna Beach', score: 62, condition: 'Acceptable', conditionClass: 'bg-condition-acceptable' },
    { location: 'St Heliers Bay', score: 58, condition: 'Marginal', conditionClass: 'bg-condition-marginal' },
  ];

  for (const { location, score, condition, conditionClass } of loc02Examples) {
    test(`LOC-02: Score bar and condition badge colour matches condition level for ${location}`, async ({ page }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // Background
      await setupBackground(page);

      const card = page.getByTestId('location-card').filter({ hasText: location });

      // Then the "<location>" score bar fill should have style "width:<score>%"
      await expect(card.getByTestId('condition-score-bar')).toHaveAttribute('style', `width:${score}%`);

      // And the "<location>" score bar fill should use a <colour> colour
      await expect(card.getByTestId('condition-score-bar')).toHaveClass(new RegExp(conditionClass));

      // And the "<location>" card should show score <score> and condition "<condition>"
      await expect(card.getByTestId('condition-score')).toContainText(`${score}`);
      await expect(card.getByTestId('condition-badge')).toHaveText(condition);

      // And the "<location>" condition badge should use a <colour> background colour
      await expect(card.getByTestId('condition-badge')).toHaveClass(new RegExp(conditionClass));
    });
  }

  test('LOC-03: Empty state is displayed after switching to an activity with no matching locations', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // Then 3 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(3);

    // When I tap the "Kayaking" activity pill
    await page.getByTestId('activity-kayaking').click();

    // Then the location list should show the empty state
    await expect(page.getByTestId('location-list-empty')).toBeVisible();

    // And the add location (+) button should still be visible
    await expect(page.getByTestId('add-location-button')).toBeVisible();

    // And a map pin icon should be displayed centered in the empty state card
    await expect(page.getByTestId('map-pin-icon')).toBeVisible();

    // And the heading "No locations yet" should be visible
    await expect(page.getByRole('heading', { name: 'No locations yet' })).toBeVisible();

    // And the subtitle "Tap + to add your first spot" should be visible
    await expect(page.getByText('Tap + to add your first spot')).toBeVisible();

    // And no location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(0);
  });

  test('LOC-04: Tapping remove button removes the location card from the list', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // Then 3 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(3);

    // When I tap the remove (x) button on the "Takapuna Beach" card
    await page.getByTestId('location-card').filter({ hasText: 'Takapuna Beach' }).getByTestId('remove-location-button').click();

    // Then the "Takapuna Beach" card should no longer be visible
    await expect(page.getByTestId('location-card').filter({ hasText: 'Takapuna Beach' })).toHaveCount(0);

    // And 2 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(2);

    // And the remaining cards should be "Mission Bay" and "St Heliers Bay" in that order
    await expect(page.getByTestId('location-card').first()).toContainText('Mission Bay');
    await expect(page.getByTestId('location-card').last()).toContainText('St Heliers Bay');
  });

  test('LOC-05: Removing all locations shows the empty state', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // Then 3 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(3);

    // When I tap the remove (x) button on the "Mission Bay" card
    await page.getByTestId('location-card').filter({ hasText: 'Mission Bay' }).getByTestId('remove-location-button').click();

    // Then 2 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(2);

    // When I tap the remove (x) button on the "Takapuna Beach" card
    await page.getByTestId('location-card').filter({ hasText: 'Takapuna Beach' }).getByTestId('remove-location-button').click();

    // Then 1 location card should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(1);

    // When I tap the remove (x) button on the "St Heliers Bay" card
    await page.getByTestId('location-card').filter({ hasText: 'St Heliers Bay' }).getByTestId('remove-location-button').click();

    // Then 0 location cards should be displayed
    await expect(page.getByTestId('location-card')).toHaveCount(0);

    // And the empty state should be visible with "No locations yet" heading
    await expect(page.getByTestId('location-list-empty')).toBeVisible();
    await expect(page.getByTestId('location-list-empty').getByRole('heading', { name: 'No locations yet' })).toBeVisible();
  });

  test('LOC-06: Wind, Tide, Water and Temperature condition icons', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    const card = page.getByTestId('location-card').first();
    const grid = card.getByTestId('conditions-grid');

    // Then the "Mission Bay" card Wind condition should display a wind arrow icon
    await expect(grid.locator('svg path[d="M14 5l7 7m0 0l-7 7m7-7H3"]')).toBeVisible();

    // And the Wind value should show "8km/h NE"
    await expect(grid.getByText('8km/h NE')).toBeVisible();

    // And the "Mission Bay" card Tide condition should display a chevron icon pointing up for rising tide
    await expect(grid.locator('svg path[d="M5 19Q3 19 4.1 17.3L10.9 6.7Q12 5 13.1 6.7L19.9 17.3Q21 19 19 19Z"]').first()).toBeVisible();

    // And the Tide value should show "Rising 70%"
    await expect(grid.getByText('Rising 70%')).toBeVisible();

    // And the chevron fill level should represent the 70% tide percentage
    // fillY = (18 - 7) * (100 - 70) / 100 + 7 = 10.3
    await expect(grid.locator('svg clipPath rect')).toHaveAttribute('y', '10.3');

    // And the "Mission Bay" card Water condition should display a water droplet icon
    await expect(grid.locator('svg path[d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"]')).toBeVisible();

    // And the Water value should show "Green"
    await expect(grid.getByText('Green')).toBeVisible();

    // And the "Mission Bay" card Temp condition should display a thermometer icon
    await expect(grid.locator('svg rect[x="8"][y="2"][width="8"][height="20"]')).toBeVisible();

    // And the Temp value should show "22°C"
    await expect(grid.getByText('22°C')).toBeVisible();

    // And the thermometer fill height should represent 22 degrees on a 0-40 range
    // fillRatio = 22 / 40 = 0.55, fillHeight = 16 * 0.55 = 8.8, fillY = 4 + 16 - 8.8 = 11.2
    await expect(grid.locator('svg rect[fill="currentColor"]')).toHaveAttribute('height', '8.8');
    await expect(grid.locator('svg rect[fill="currentColor"]')).toHaveAttribute('y', '11.2');
  });

  test('LOC-07: Location cards display in a single column on mobile', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // Then the location cards should be stacked vertically in a single column
    const cards = page.getByTestId('location-card');
    await expect(cards).toHaveCount(3);

    const layout = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="location-list"] section > div');
      const cards = Array.from(container.children);
      const rects = cards.map((c) => c.getBoundingClientRect());
      const allSameLeft = rects.every((r) => r.left === rects[0].left);
      const verticallyStacked = rects.every((r, i) => i === 0 || r.top > rects[i - 1].top);
      return { allSameLeft, verticallyStacked };
    });
    expect(layout.allSameLeft).toBe(true);
    expect(layout.verticallyStacked).toBe(true);

    // And each card should be full-width within the content area
    const fullWidth = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="location-list"] section > div');
      const containerWidth = container.getBoundingClientRect().width;
      const cards = Array.from(container.children);
      return cards.every((c) => Math.abs(c.getBoundingClientRect().width - containerWidth) < 2);
    });
    expect(fullWidth).toBe(true);
  });

  // LOC-08 Scenario Outline: Location list displays correctly at various viewports
  const loc09Examples = [
    { breakpoint: 'tablet', width: 768 },
    { breakpoint: 'large tablet', width: 1024 },
    { breakpoint: 'desktop', width: 1280 },
  ];

  for (const { breakpoint, width } of loc09Examples) {
    test(`LOC-08: Location list displays correctly at ${breakpoint} viewport`, async ({ page }) => {
      // Given the browser viewport is <width>
      await page.setViewportSize({ width, height: 800 });

      // Background
      await setupBackground(page);

      // Then the "Locations" heading should be visible
      await expect(page.getByTestId('locations-heading')).toBeVisible();

      // And the add location (+) button should be visible
      await expect(page.getByTestId('add-location-button')).toBeVisible();

      // And 3 location cards should be displayed
      await expect(page.getByTestId('location-card')).toHaveCount(3);

      // And the cards should be in a grid layout
      const display = await page.evaluate(() => {
        const container = document.querySelector('[data-testid="location-card"]').parentElement.parentElement;
        return window.getComputedStyle(container).display;
      });
      expect(display).toBe('grid');
    });
  }

  test('LOC-09: Remove button is keyboard accessible', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // And I focus on the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I use Tab to navigate to the remove (x) button on the "Mission Bay" card
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Then the remove button should receive focus
    await expect(page.getByTestId('location-card').first().getByTestId('remove-location-button')).toBeFocused();

    // When I press Enter on the focused remove button
    await page.keyboard.press('Enter');

    // Then the "Mission Bay" card should be removed from the list
    await expect(page.getByTestId('location-card').filter({ hasText: 'Mission Bay' })).toHaveCount(0);

    // And 2 location cards should remain
    await expect(page.getByTestId('location-card')).toHaveCount(2);

    // When I use Shift+Tab to navigate back to the add location (+) button
    await page.keyboard.press('Shift+Tab');

    // Then the add location button should receive focus
    await expect(page.getByTestId('add-location-button')).toBeFocused();

    // When I press Tab twice
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Then the remove (x) button on the "Takapuna Beach" card should receive focus
    await expect(page.getByTestId('location-card').filter({ hasText: 'Takapuna Beach' }).getByTestId('remove-location-button')).toBeFocused();
  });
});
