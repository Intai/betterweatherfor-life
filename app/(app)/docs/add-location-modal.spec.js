import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

// (No Background helpers needed for ALM-01; Background prerequisites
// are satisfied by the seeded database and default page state.)

/**
 * Pre-populate localStorage with a saved location for "Piha Beach"
 * before any page navigation occurs.
 */
async function setupLocalStorageWithPihaBeach(context) {
  await context.addInitScript(() => {
    const pihaLocation = {
      name: 'Piha Beach',
      area: 'Auckland 0772, New Zealand',
      latitude: -36.9469,
      longitude: 174.4684,
      timeZone: 'Pacific/Auckland',
    };
    const key = `${pihaLocation.latitude},${pihaLocation.longitude}`;
    const locations = { [key]: pihaLocation };
    localStorage.setItem('locations', JSON.stringify(locations));
  });
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Add Location Modal', () => {
  test('ALM-01: Tapping the + button opens the Add Location modal on mobile', async ({ page }) => {
    // @purge-data - Restore the seed data to initial state
    execSync('make reseed', { stdio: 'inherit' });

    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // Then the add location (+) button should be visible in the location list header
    await expect(page.getByRole('button', { name: 'Add location' })).toBeVisible();

    // When I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // And the modal should be positioned fixed to the bottom
    const modalStyles = await page.getByTestId('add-location-modal').evaluate((el) => {
      const style = getComputedStyle(el);
      return { position: style.position, bottom: style.bottom };
    });
    expect(modalStyles.position).toBe('fixed');
    expect(modalStyles.bottom).toBe('0px');

    // And the modal should have rounded top corners
    const borderRadii = await page.getByTestId('add-location-modal').evaluate((el) => {
      const style = getComputedStyle(el);
      return {
        topLeft: style.borderTopLeftRadius,
        topRight: style.borderTopRightRadius,
        bottomLeft: style.borderBottomLeftRadius,
        bottomRight: style.borderBottomRightRadius,
      };
    });
    expect(parseFloat(borderRadii.topLeft)).toBeGreaterThan(0);
    expect(parseFloat(borderRadii.topRight)).toBeGreaterThan(0);
    expect(parseFloat(borderRadii.bottomLeft)).toBe(0);
    expect(parseFloat(borderRadii.bottomRight)).toBe(0);

    // And a semi-transparent backdrop should be visible behind the modal
    await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
    const bgColor = await page.locator('[data-slot="dialog-overlay"]').evaluate((el) => {
      return getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toContain('0.5');
  });

  [
    { breakpoint: 'tablet', width: 768, height: 1024 },
    { breakpoint: 'large tablet', width: 1024, height: 768 },
    { breakpoint: 'desktop', width: 1280, height: 800 },
  ].forEach(({ breakpoint, width, height }) => {
    test(`ALM-02: Modal is centred on tablet and desktop at ${breakpoint} viewport`, async ({ page }) => {
      // Given the browser viewport is <width>
      await page.setViewportSize({ width, height });

      // When I navigate to the "/auckland/home" page
      await page.goto('http://localhost:3000/auckland/home');

      // And I tap the add location (+) button
      await page.getByTestId('add-location-button').click();

      // Then the Add Location modal should appear
      await expect(page.getByTestId('add-location-modal')).toBeVisible();

      // And the modal should be centred on the viewport
      const modalBox = await page.getByTestId('add-location-modal').boundingBox();
      const viewport = page.viewportSize();
      const modalCenterX = modalBox.x + modalBox.width / 2;
      const modalCenterY = modalBox.y + modalBox.height / 2;
      const viewportCenterX = viewport.width / 2;
      const viewportCenterY = viewport.height / 2;
      expect(Math.abs(modalCenterX - viewportCenterX)).toBeLessThan(2);
      expect(Math.abs(modalCenterY - viewportCenterY)).toBeLessThan(2);

      // And a semi-transparent backdrop should be visible behind the modal
      await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
      const bgColor = await page.locator('[data-slot="dialog-overlay"]').evaluate((el) => {
        return getComputedStyle(el).backgroundColor;
      });
      expect(bgColor).toContain('0.5');
    });
  });

  test('ALM-03: Tapping the close button closes the modal', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // And the modal should display the title "Add Location"
    await expect(page.getByTestId('add-location-modal').getByRole('heading', { name: 'Add location' })).toBeVisible();

    // And the modal should display a close (x) button
    await expect(page.getByTestId('add-location-modal').getByRole('button', { name: 'Close' })).toBeVisible();

    // And the modal should display a search input field
    await expect(page.getByTestId('location-search-input')).toBeVisible();

    // And the search input should have a search icon
    await expect(page.getByTestId('add-location-modal').locator('.lucide-search')).toBeVisible();

    // And the search input placeholder should be "Search locations..."
    await expect(page.getByTestId('location-search-input')).toHaveAttribute('placeholder', 'Search locations...');

    // When I tap the close (x) button on the modal
    await page.getByTestId('add-location-modal').getByRole('button', { name: 'Close' }).click();

    // Then the modal should close
    await expect(page.getByTestId('add-location-modal')).toBeHidden();

    // And the backdrop should no longer be visible
    await expect(page.locator('[data-slot="dialog-overlay"]')).toBeHidden();
  });

  test('ALM-04: Tapping the backdrop closes the modal', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // When I tap the backdrop overlay
    await page.locator('[data-slot="dialog-overlay"]').click({ position: { x: 187, y: 50 } });

    // Then the modal should close
    await expect(page.getByTestId('add-location-modal')).toBeHidden();

    // And the backdrop should no longer be visible
    await expect(page.locator('[data-slot="dialog-overlay"]')).toBeHidden();
  });

  test('ALM-05: Pressing Escape closes the modal', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // When I press the Escape key
    await page.keyboard.press('Escape');

    // Then the modal should close
    await expect(page.getByTestId('add-location-modal')).toBeHidden();
  });

  test('ALM-06: Search results display location name in bold and area in muted text', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I type "Mi" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Mi');

    // And I wait 100ms
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)));

    // And I type "ssion" into the search input
    await page.getByTestId('location-search-input').pressSequentially('ssion');

    // And I wait 100ms
    await page.evaluate(() => new Promise(r => setTimeout(r, 100)));

    // And I type " Bay" into the search input
    await page.getByTestId('location-search-input').pressSequentially(' Bay');

    // And I wait for the search results to appear
    await page.getByTestId('suggestion-item').first().waitFor();

    // Then the first result should display "Mission Bay" in bold
    await expect(page.getByTestId('suggestion-item').first().locator('p').first()).toHaveText('Mission Bay');
    const firstMainFontWeight = await page.getByTestId('suggestion-item').first().locator('p').first().evaluate((el) => {
      return getComputedStyle(el).fontWeight;
    });
    expect(Number(firstMainFontWeight)).toBeGreaterThanOrEqual(500);

    // And the first result should display "Auckland, New Zealand" in muted text
    await expect(page.getByTestId('suggestion-item').first().locator('p').nth(1)).toHaveText('Auckland, New Zealand');
    const firstSecondaryClasses = await page.getByTestId('suggestion-item').first().locator('p').nth(1).evaluate((el) => {
      return el.className;
    });
    expect(firstSecondaryClasses).toContain('text-muted-foreground');

    // And the second result should display "Mission Bay" in bold
    await expect(page.getByTestId('suggestion-item').nth(1).locator('p').first()).toHaveText('Mission Bay');
    const secondMainFontWeight = await page.getByTestId('suggestion-item').nth(1).locator('p').first().evaluate((el) => {
      return getComputedStyle(el).fontWeight;
    });
    expect(Number(secondMainFontWeight)).toBeGreaterThanOrEqual(500);

    // And the second result should display "San Diego, CA, USA" in muted text
    await expect(page.getByTestId('suggestion-item').nth(1).locator('p').nth(1)).toHaveText('San Diego, CA, USA');
    const secondSecondaryClasses = await page.getByTestId('suggestion-item').nth(1).locator('p').nth(1).evaluate((el) => {
      return el.className;
    });
    expect(secondSecondaryClasses).toContain('text-muted-foreground');

    // When I clear the search input
    await page.getByTestId('location-search-input').fill('');

    // Then the search results should be hidden
    await expect(page.getByTestId('suggestion-item')).toHaveCount(0);
  });

  test('ALM-07: Search results list is scrollable when many results are returned', async ({ page }) => {
    // Given the browser viewport is 667x375px landscape
    await page.setViewportSize({ width: 667, height: 375 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I type "Beach" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Beach');

    // And I wait for the search results to appear
    await page.getByTestId('suggestion-item').first().waitFor();

    // Then the search results list should be scrollable
    const scrollInfo = await page.getByTestId('search-results').evaluate((el) => {
      const styles = getComputedStyle(el);
      return {
        overflowY: styles.overflowY,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      };
    });
    expect(['auto', 'scroll']).toContain(scrollInfo.overflowY);
    expect(scrollInfo.scrollHeight).toBeGreaterThan(scrollInfo.clientHeight);
  });

  test('ALM-08: Tapping a search result saves the location and closes the modal', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I type "Piha" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Piha');

    // And I wait for the search results to appear
    await page.getByTestId('suggestion-item').first().waitFor();

    // And I tap the "Piha Beach" result
    // Set up network request monitoring before clicking
    const postPromise = page.waitForResponse(
      (response) => response.url().includes('/api/locations') && response.request().method() === 'POST'
    );
    await page.getByTestId('suggestion-item').filter({ hasText: 'Piha Beach' }).first().click();

    // Then a POST request should be sent to /api/locations with the location details
    const postResponse = await postPromise;
    expect(postResponse.status()).toBe(200);

    // And the modal should close
    // The app navigates from /auckland/home to /home when adding a location from a city page
    await page.waitForURL('**/home');
    await expect(page.getByTestId('add-location-modal')).toBeHidden();

    // And the location "Piha Beach" should be saved to localStorage
    const savedLocation = await page.evaluate(() => {
      const locations = JSON.parse(localStorage.getItem('locations') || '{}');
      return Object.values(locations).find((loc) => loc.name === 'Piha Beach');
    });
    expect(savedLocation).toBeTruthy();
    expect(savedLocation.name).toBe('Piha Beach');

    // And a Scheduled Location Card for "Piha Beach" should appear after the scored location cards
    await expect(page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first()).toBeVisible();

    // And the card should have a dashed border
    const borderStyle = await page.getByTestId('scheduled-location-card').first().evaluate((el) => {
      return getComputedStyle(el).borderStyle;
    });
    expect(borderStyle).toBe('dashed');

    // And the card header should display the location name "Piha Beach"
    await expect(
      page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first().locator('[data-slot="card-title"]')
    ).toHaveText('Piha Beach');

    // And the card should display the area "Auckland 0772, New Zealand"
    await expect(
      page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first().locator('[data-slot="card-description"]')
    ).toHaveText('Auckland 0772, New Zealand');

    // And the card should display a remove (x) button
    await expect(
      page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first().getByTestId('remove-location-button')
    ).toBeVisible();

    // And the card should display a cloud icon centred in the card body
    await expect(
      page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first().getByTestId('cloud-icon')
    ).toBeVisible();

    // And the card should display the heading "Forecast scheduled"
    const scheduledCard = page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first();
    await expect(scheduledCard.locator('[data-slot="card-content"] p').first()).toHaveText('Forecast scheduled');

    // And the card should display the description
    await expect(scheduledCard.locator('[data-slot="card-content"] p').last()).toContainText(
      'scheduled this location for forecast collection'
    );
  });

  test('ALM-09: Tapping remove button on a Scheduled Location Card removes it', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And localStorage contains a saved location "Piha Beach" with no forecast data
    await setupLocalStorageWithPihaBeach(context);

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then a Scheduled Location Card should be displayed for "Piha Beach"
    await expect(page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' })).toBeVisible();

    // When I tap the remove (x) button on the "Piha Beach" scheduled card
    await page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first().getByTestId('remove-location-button').click();

    // Then the "Piha Beach" scheduled card should no longer be visible
    await expect(page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' })).toBeHidden();

    // And "Piha Beach" should be removed from localStorage
    const locations = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('locations') || '{}');
    });
    const hasPiha = Object.values(locations).some((loc) => loc.name === 'Piha Beach');
    expect(hasPiha).toBe(false);
  });

  test('ALM-10: Recovering from a search error by typing a new query', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // When the browser blocks domain "maps.googleapis.com"
    await page.route('**/*maps.googleapis.com**', (route) => route.abort());

    // And I type "Piha" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Piha');

    // Then the error message "Search failed. Please try again." should be displayed
    await expect(page.getByTestId('search-error')).toBeVisible();
    await expect(page.getByTestId('search-error')).toHaveText('Search failed. Please try again.');

    // And no search results should be displayed
    await expect(page.getByTestId('suggestion-item')).toHaveCount(0);

    // When I clear the search input
    await page.getByTestId('location-search-input').fill('');

    // Then the error message should no longer be visible
    await expect(page.getByTestId('search-error')).toBeHidden();

    // And the browser unblocks domain "maps.googleapis.com"
    await page.unroute('**/*maps.googleapis.com**');

    // And I type "Mission Bay" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Mission Bay');

    // Then search results for "Mission Bay" should be displayed
    await page.getByTestId('suggestion-item').first().waitFor();
    await expect(page.getByTestId('suggestion-item').first()).toContainText('Mission Bay');
  });

  test('ALM-11: No results state is displayed when autocomplete returns empty results', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I type "xyznonexistent" into the search input
    await page.getByTestId('location-search-input').pressSequentially('xyznonexistent');

    // Then the message "No results found" should be displayed in the modal
    await expect(page.getByTestId('no-results')).toBeVisible();
    await expect(page.getByTestId('no-results')).toHaveText('No results found');

    // And no search result items should be displayed
    await expect(page.getByTestId('suggestion-item')).toHaveCount(0);
  });

  test('ALM-12: Modal is keyboard accessible', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I focus on the add location (+) button
    await page.getByTestId('add-location-button').focus();
    await expect(page.getByTestId('add-location-button')).toBeFocused();

    // And I press Enter on the focused add location button
    await page.keyboard.press('Enter');

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // And focus should move to the search input field
    await expect(page.getByTestId('location-search-input')).toBeFocused();

    // When I type "Piha" using the keyboard
    await page.getByTestId('location-search-input').pressSequentially('Piha');

    // And I wait for the search results to appear
    await page.getByTestId('suggestion-item').first().waitFor();

    // And I use Tab to navigate to the first search result
    await page.keyboard.press('Tab');

    // Then the first search result should receive focus
    await expect(page.getByTestId('suggestion-item').first()).toBeFocused();

    // When I press Enter on the focused search result
    await page.keyboard.press('Enter');

    // Then the location should be saved and the modal should close
    await page.waitForURL('**/home');
    await expect(page.getByTestId('add-location-modal')).toBeHidden();
    const savedLocation = await page.evaluate(() => {
      const locations = JSON.parse(localStorage.getItem('locations') || '{}');
      return Object.values(locations).find((loc) => loc.name === 'Piha Beach');
    });
    expect(savedLocation).toBeTruthy();
    expect(savedLocation.name).toBe('Piha Beach');
    await expect(page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).first()).toBeVisible();
  });

  test('ALM-13: Escape key closes the modal and returns focus to the trigger button', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');

    // And I press Enter on the add location (+) button
    await page.getByTestId('add-location-button').focus();
    await page.keyboard.press('Enter');

    // Then the Add Location modal should appear
    await expect(page.getByTestId('add-location-modal')).toBeVisible();

    // When I press the Escape key
    await page.keyboard.press('Escape');

    // Then the modal should close
    await expect(page.getByTestId('add-location-modal')).toBeHidden();

    // And the add location (+) button should receive focus
    await expect(page.getByTestId('add-location-button')).toBeFocused();
  });

  test('ALM-14: Scheduled Location Card remove button is keyboard accessible', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And localStorage contains a saved location "Piha Beach" with no forecast data
    await setupLocalStorageWithPihaBeach(context);

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Wait for the scheduled card to appear
    await page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' }).waitFor();

    // And I use Tab to navigate to the remove (x) button on the "Piha Beach" scheduled card
    const removeButton = page.getByTestId('scheduled-location-card')
      .filter({ hasText: 'Piha Beach' })
      .getByTestId('remove-location-button');
    let maxTabs = 20;
    while (maxTabs > 0) {
      await page.keyboard.press('Tab');
      if (await removeButton.evaluate((el) => el === document.activeElement)) break;
      maxTabs--;
    }

    // Then the remove button should receive focus
    await expect(removeButton).toBeFocused();

    // When I press Enter on the focused remove button
    await page.keyboard.press('Enter');

    // Then the "Piha Beach" scheduled card should be removed
    await expect(page.getByTestId('scheduled-location-card').filter({ hasText: 'Piha Beach' })).toBeHidden();

    // And "Piha Beach" should be removed from localStorage
    const locations = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('locations') || '{}');
    });
    const hasPiha = Object.values(locations).some((loc) => loc.name === 'Piha Beach');
    expect(hasPiha).toBe(false);
  });
});
