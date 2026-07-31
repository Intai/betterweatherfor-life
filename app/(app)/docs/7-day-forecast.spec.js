import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

// Background: Given the application is running
// (no special setup needed - navigations resolve against use.baseURL)

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: 7-Day Forecast Page', () => {
  // ===========================================================
  // Scenario Group: Page Header and Navigation (FRC-01)
  // ===========================================================

  test('FRC-01: Forecast page displays sticky header with title and back button', async ({ page }) => {
    // @purge-data - Restore the seed data to initial state (runs FIRST)
    execSync('make reseed', { stdio: 'inherit' });

    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the top appbar should be sticky at the top of the viewport
    const appbarStyle = await page.getByTestId('top-appbar-mobile-sub').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return { position: style.position, top: style.top };
    });
    expect(appbarStyle.position).toBe('sticky');
    expect(appbarStyle.top).toBe('0px');

    // And the top appbar should display the page title "7-Day Forecast"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('7-Day Forecast');

    // And the back button should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back')).toBeVisible();

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/);
  });

  // ===========================================================
  // Scenario Group: Activity Selector (FRC-02)
  // ===========================================================

  test('FRC-02: Switching activity updates all daily recommendation cards', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the activity selector should be visible
    await expect(page.getByTestId('activity-selector')).toBeVisible();

    // And the following activity pills should be displayed: SUP, Kayaking, Snorkelling, Cycling
    await expect(page.getByTestId('activity-selector').getByRole('button', { name: 'SUP' })).toBeVisible();
    await expect(page.getByTestId('activity-selector').getByRole('button', { name: 'Kayaking' })).toBeVisible();
    await expect(page.getByTestId('activity-selector').getByRole('button', { name: 'Snorkelling' })).toBeVisible();
    await expect(page.getByTestId('activity-selector').getByRole('button', { name: 'Cycling' })).toBeVisible();

    // When I select the "SUP" activity pill
    await page.getByTestId('activity-selector').getByTestId('activity-sup').click();

    // Then the "SUP" activity pill should be selected
    const supIsSelected = await page.getByTestId('activity-selector').getByTestId('activity-sup').evaluate(
      (el) => el.className.includes('bg-primary'),
    );
    expect(supIsSelected).toBe(true);

    // And 7 day cards should be displayed
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card')).toHaveCount(7);

    // When I tap the "Snorkelling" activity pill
    await page.getByTestId('activity-selector').getByTestId('activity-snorkelling').click();

    // Then the "Snorkelling" activity pill should be selected
    const snorkIsSelected = await page.getByTestId('activity-selector').getByTestId('activity-snorkelling').evaluate(
      (el) => el.className.includes('bg-primary'),
    );
    expect(snorkIsSelected).toBe(true);

    // And the day cards should be stacked vertically in a single column
    const isVerticalStack = await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').evaluate(
      (el) => window.getComputedStyle(el).display === 'block',
    );
    expect(isVerticalStack).toBe(true);

    // And 7 day cards should be displayed
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card')).toHaveCount(7);

    // And the day card scores and locations should reflect snorkelling forecast data
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').first().getByTestId('best-spot')).toContainText('Goat Island');
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').first().getByTestId('score-circle')).toHaveText('68');
  });

  // ===========================================================
  // Scenario Group: Day Selector Strip (FRC-03)
  // ===========================================================

  test('FRC-03: Day selector strip displays 7 day buttons in phone portrait', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // And I select the "SUP" activity pill
    await page.getByTestId('activity-selector').getByTestId('activity-sup').click();

    // Then the day selector strip should be visible
    await expect(page.getByTestId('forecast-day-list').getByTestId('day-selector-strip')).toBeVisible();

    // And the day selector strip should display 7 day buttons
    await expect(page.getByTestId('day-selector-strip').getByTestId('day-selector-button')).toHaveCount(7);

    // And each day button should show a day abbreviation, date number, and mini score badge
    const buttonContents = await page.getByTestId('day-selector-strip').evaluate((strip) => {
      const buttons = strip.querySelectorAll('[data-testid="day-selector-button"]');
      return Array.from(buttons).map((btn) => {
        const children = Array.from(btn.children);
        const hasAbbreviation = children.some((c) => c.tagName === 'SPAN' && /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)$/.test(c.textContent.trim()));
        const hasDateNumber = children.some((c) => c.tagName === 'SPAN' && /^\d{1,2}$/.test(c.textContent.trim()));
        const hasScoreBadge = btn.querySelector('[data-testid="day-score-badge"]') !== null;
        return { hasAbbreviation, hasDateNumber, hasScoreBadge };
      });
    });
    for (const content of buttonContents) {
      expect(content.hasAbbreviation).toBe(true);
      expect(content.hasDateNumber).toBe(true);
      expect(content.hasScoreBadge).toBe(true);
    }

    // And the mini score badges should be colour-coded by condition
    const expectedConditions = ['ideal', 'acceptable', 'acceptable', 'ideal', 'ideal', 'marginal', 'acceptable'];
    const conditionColorMap = {
      ideal: 'rgb(34, 197, 94)',
      acceptable: 'rgb(14, 165, 233)',
      marginal: 'rgb(249, 115, 22)',
      unsuitable: 'rgb(239, 68, 68)',
    };
    const badgeColors = await page.getByTestId('day-selector-strip').evaluate((strip) => {
      const badges = strip.querySelectorAll('[data-testid="day-score-badge"]');
      return Array.from(badges).map((badge) => window.getComputedStyle(badge).backgroundColor);
    });
    for (let i = 0; i < expectedConditions.length; i++) {
      expect(badgeColors[i]).toBe(conditionColorMap[expectedConditions[i]]);
    }
  });

  // ===========================================================
  // Scenario Group: Day Selector Strip (FRC-04)
  // ===========================================================

  test('FRC-04: Tapping a day button in the selector strip smooth-scrolls to that day card', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // And I tap the Day 7 button in the day selector strip
    await page.getByTestId('forecast-day-list').getByTestId('day-selector-strip').getByTestId('day-selector-button').last().click();

    // Then the page should smooth-scroll to the Day 7 card
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').last()).toBeVisible();
  });

  // ===========================================================
  // Scenario Group: Day Selector Strip (FRC-05)
  // ===========================================================

  test('FRC-05: Day selector strip is hidden in phone landscape', async ({ page }) => {
    // Given the browser viewport is 667px wide and 375px tall (landscape)
    await page.setViewportSize({ width: 667, height: 375 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the day selector strip should not be visible
    await expect(page.getByTestId('forecast-day-list').getByTestId('day-selector-strip')).toBeHidden();

    // And the day cards should be visible in a horizontal scroll layout
    const isHorizontalScroll = await page.getByTestId('forecast-cards').locator('> div').evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.display === 'flex' && style.overflowX === 'auto' && el.scrollWidth > el.clientWidth;
    });
    expect(isHorizontalScroll).toBe(true);

    // And I should be able to scroll horizontally to see all 7 day cards
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-day-card')).toHaveCount(7);
    const scrollResult = await page.getByTestId('forecast-cards').locator('> div').evaluate((el) => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
      const cards = el.querySelectorAll('[data-testid="forecast-day-card"]');
      const lastCard = cards[cards.length - 1];
      const rect = lastCard.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    });
    expect(scrollResult).toBe(true);
  });

  // ===========================================================
  // Scenario Group: Day Selector Strip (FRC-06)
  // ===========================================================

  test('FRC-06: Day selector strip is visible on tablet (768px, 2-column)', async ({ page }) => {
    // Given the browser viewport is 768px
    await page.setViewportSize({ width: 768, height: 1024 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the day selector strip should be visible
    await expect(page.getByTestId('forecast-day-list').getByTestId('day-selector-strip')).toBeVisible();

    // And the day selector strip should be horizontally scrollable
    const isScrollable768 = await page.getByTestId('day-selector-strip').locator('> div').evaluate((el) => {
      return window.getComputedStyle(el).overflowX === 'auto';
    });
    expect(isScrollable768).toBe(true);

    // And 7 day cards should be displayed in a 2-column grid layout
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-day-card')).toHaveCount(7);
    const columnCount768 = await page.getByTestId('forecast-cards').locator('> div').evaluate((el) => {
      const cards = el.querySelectorAll('[data-testid="forecast-day-card"]');
      const rects = Array.from(cards).map((c) => c.getBoundingClientRect());
      const firstRowTop = rects[0].top;
      return rects.filter((r) => Math.abs(r.top - firstRowTop) < 5).length;
    });
    expect(columnCount768).toBe(2);
  });

  test('FRC-06: Day selector strip is visible on large tablet (1024px, 3-column)', async ({ page }) => {
    // Given the browser viewport is 1024px
    await page.setViewportSize({ width: 1024, height: 768 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the day selector strip should be visible
    await expect(page.getByTestId('forecast-day-list').getByTestId('day-selector-strip')).toBeVisible();

    // And the day selector strip should be horizontally scrollable
    const isScrollable1024 = await page.getByTestId('day-selector-strip').locator('> div').evaluate((el) => {
      return window.getComputedStyle(el).overflowX === 'auto';
    });
    expect(isScrollable1024).toBe(true);

    // And 7 day cards should be displayed in a 3-column grid layout
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-day-card')).toHaveCount(7);
    const columnCount1024 = await page.getByTestId('forecast-cards').locator('> div').evaluate((el) => {
      const cards = el.querySelectorAll('[data-testid="forecast-day-card"]');
      const rects = Array.from(cards).map((c) => c.getBoundingClientRect());
      const firstRowTop = rects[0].top;
      return rects.filter((r) => Math.abs(r.top - firstRowTop) < 5).length;
    });
    expect(columnCount1024).toBe(3);
  });

  test('FRC-06: Day selector strip is visible on desktop (1280px, 3-column)', async ({ page }) => {
    // Given the browser viewport is 1280px
    await page.setViewportSize({ width: 1280, height: 800 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // Then the day selector strip should be visible
    await expect(page.getByTestId('forecast-day-list').getByTestId('day-selector-strip')).toBeVisible();

    // And the day selector strip should be horizontally scrollable
    const isScrollable1280 = await page.getByTestId('day-selector-strip').locator('> div').evaluate((el) => {
      return window.getComputedStyle(el).overflowX === 'auto';
    });
    expect(isScrollable1280).toBe(true);

    // And 7 day cards should be displayed in a 3-column grid layout
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-day-card')).toHaveCount(7);
    const columnCount1280 = await page.getByTestId('forecast-cards').locator('> div').evaluate((el) => {
      const cards = el.querySelectorAll('[data-testid="forecast-day-card"]');
      const rects = Array.from(cards).map((c) => c.getBoundingClientRect());
      const firstRowTop = rects[0].top;
      return rects.filter((r) => Math.abs(r.top - firstRowTop) < 5).length;
    });
    expect(columnCount1280).toBe(3);
  });

  // ===========================================================
  // Scenario Group: Day Card Content - Standard (FRC-07)
  // ===========================================================

  const frc07Examples = [
    { day: 1, today: 'visible', bestDay: 'hidden', score: '85', condition: 'ideal', bestWindow: '06:00 - 13:00' },
    { day: 2, today: 'hidden', bestDay: 'hidden', score: '77', condition: 'acceptable', bestWindow: '08:00 - 14:00' },
    { day: 3, today: 'hidden', bestDay: 'hidden', score: '70', condition: 'acceptable', bestWindow: '06:00 - 12:00' },
    { day: 4, today: 'hidden', bestDay: 'visible', score: '95', condition: 'ideal', bestWindow: '09:00 - 14:00' },
    { day: 5, today: 'hidden', bestDay: 'hidden', score: '80', condition: 'ideal', bestWindow: '07:00 - 14:00' },
    { day: 6, today: 'hidden', bestDay: 'hidden', score: '40', condition: 'marginal', bestWindow: '06:00 - 11:00' },
    { day: 7, today: 'hidden', bestDay: 'hidden', score: '65', condition: 'acceptable', bestWindow: '06:00 - 10:00' },
  ];

  for (const { day, today, bestDay, score, condition, bestWindow } of frc07Examples) {
    test(`FRC-07: Day ${day} card displays all required content`, async ({ page }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // When I navigate to the "/auckland/forecast" page
      await page.goto('/auckland/forecast');
      await page.waitForLoadState('networkidle');

      const card = page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(day - 1);

      // Scroll the card into view for cards further down the list
      await card.scrollIntoViewIfNeeded();

      // Then the day card should display a date heading in short date format (e.g. "Sun 15 Mar" or "Sun, Mar 15")
      const dateHeading = await card.getByTestId('date-heading').textContent();
      const dayAbbr = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/.test(dateHeading);
      const hasMonth = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(dateHeading);
      const hasDay = /\d{1,2}/.test(dateHeading);
      expect(dayAbbr && hasMonth && hasDay).toBe(true);

      // And the today chip should be visible or hidden
      if (today === 'visible') {
        await expect(card.getByTestId('today-chip')).toBeVisible();
      } else {
        await expect(card.getByTestId('today-chip')).toBeHidden();
      }

      // And the best day badge should be visible or hidden
      if (bestDay === 'visible') {
        await expect(card.getByTestId('best-day-badge')).toBeVisible();
      } else {
        await expect(card.getByTestId('best-day-badge')).toBeHidden();
      }

      // And the location name should be "Mission Bay"
      await expect(card.getByTestId('best-spot')).toContainText('Mission Bay');

      // And the score should match the expected value
      await expect(card.getByTestId('score-circle')).toHaveText(score);

      // And the score background should match the condition
      await expect(card.getByTestId('score-circle')).toHaveAttribute('class', new RegExp(`bg-condition-${condition}`));

      // And the condition badge should match
      await expect(card.getByTestId('condition-badge')).toContainText(condition.charAt(0).toUpperCase() + condition.slice(1));

      // And the best window should match
      await expect(card.getByTestId('best-window')).toContainText(bestWindow);

      // And the summary should be present
      await expect(card.getByTestId('day-summary')).toContainText('Light onshore breeze, excellent for paddling this morning.');
    });
  }

  // ===========================================================
  // Scenario Group: Day Card Content - Unsuitable Day (FRC-08)
  // ===========================================================

  const frc08Examples = [
    { day: 1, today: 'visible', score: '25' },
    { day: 2, today: 'hidden', score: '17' },
    { day: 3, today: 'hidden', score: '10' },
    { day: 4, today: 'hidden', score: '35' },
    { day: 5, today: 'hidden', score: '20' },
    { day: 6, today: 'hidden', score: '0' },
    { day: 7, today: 'hidden', score: '5' },
  ];

  for (const { day, today, score } of frc08Examples) {
    test(`FRC-08: Day ${day} unsuitable card shows simplified display with no location recommendation`, async ({ page }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // When I navigate to the "/auckland/forecast" page
      await page.goto('/auckland/forecast');
      await page.waitForLoadState('networkidle');

      // And I select the "Cycling" activity pill
      await page.getByTestId('activity-selector').getByTestId('activity-cycling').click();

      const card = page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(day - 1);

      // Scroll the card into view for cards further down the list
      await card.scrollIntoViewIfNeeded();

      // Then the day card should display a date heading in short date format (e.g. "Wed 5 Feb")
      const dateHeading = await card.getByTestId('date-heading').textContent();
      const dayAbbr = /^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/.test(dateHeading);
      const hasMonth = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/.test(dateHeading);
      const hasDay = /\d{1,2}/.test(dateHeading);
      expect(dayAbbr && hasMonth && hasDay).toBe(true);

      // And the today chip should be visible or hidden
      if (today === 'visible') {
        await expect(card.getByTestId('today-chip')).toBeVisible();
      } else {
        await expect(card.getByTestId('today-chip')).toBeHidden();
      }

      // And the best day badge should be hidden
      await expect(card.getByTestId('best-day-badge')).toBeHidden();

      // And the location name should be hidden
      await expect(card.getByTestId('best-spot')).toBeHidden();

      // And the score should match the expected value
      await expect(card.getByTestId('score-circle')).toHaveText(score);

      // And the score background should be unsuitable
      await expect(card.getByTestId('score-circle')).toHaveAttribute('class', /bg-condition-unsuitable/);

      // And the condition badge should be Unsuitable
      await expect(card.getByTestId('condition-badge')).toContainText('Unsuitable');

      // And the best window should show "No recommended window"
      await expect(card.getByTestId('no-window')).toContainText('No recommended window');

      // And the summary should match
      await expect(card.getByTestId('day-summary')).toContainText('42km/h SW headwind with heavy rain and 94% humidity make cycling dangerous and extremely uncomfortable.');
    });
  }

  // ===========================================================
  // Scenario Group: Card Navigation (FRC-09)
  // ===========================================================

  test('FRC-09: Tapping a day card navigates to Home with that day selected', async ({ browser }) => {
    // Given the browser viewport is 375px
    // And the browser locale is set to en-NZ in context
    const context = await browser.newContext({
      locale: 'en-NZ',
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');
    await page.waitForLoadState('networkidle');

    // And I select the "SUP" activity pill
    await page.getByTestId('activity-selector').getByTestId('activity-sup').click();

    // Wait for 7 day cards to be displayed
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card')).toHaveCount(7);

    // And I tap the Day 2 card with acceptable condition
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(1).scrollIntoViewIfNeeded();
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(1).click();

    // Then the browser should navigate to the "/auckland/home" page
    await page.waitForURL(/\/auckland\/home/);
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the time picker should be set to the Day 2 date from today
    const today = new Date();
    const day2 = new Date(today);
    day2.setDate(today.getDate() + 1);
    const day2Label = day2.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(page.getByTestId('time-window-picker').getByTestId('pick-date-button')).toContainText(day2Label);

    // When I navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // And I tap the Day 6 card with marginal condition
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(5).scrollIntoViewIfNeeded();
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(5).click();

    // Then the browser should navigate to the "/auckland/home" page
    await page.waitForURL(/\/auckland\/home/);
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the time picker should be set to the Day 6 date from today
    const day6 = new Date(today);
    day6.setDate(today.getDate() + 5);
    const day6Label = day6.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(page.getByTestId('time-window-picker').getByTestId('pick-date-button')).toContainText(day6Label);

    // When I navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    // And I select the "Cycling" activity pill
    await page.getByTestId('activity-selector').getByTestId('activity-cycling').click();
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').first().waitFor({ state: 'visible' });

    // And I tap the Day 2 card with unsuitable condition
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(1).scrollIntoViewIfNeeded();
    await page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').nth(1).click();

    // Then the browser should navigate to the "/auckland/home" page
    await page.waitForURL(/\/auckland\/home/);
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the time picker should be set to the Day 2 date from today
    await expect(page.getByTestId('time-window-picker').getByTestId('pick-date-button')).toContainText(day2Label);

    await context.close();
  });

  // ===========================================================
  // Scenario Group: Empty State (FRC-10)
  // ===========================================================

  test('FRC-10: Empty state is displayed when no locations are saved', async ({ browser }) => {
    // Given the browser viewport is 375px
    // And the browser local storage is cleared in context
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    await context.addInitScript(() => {
      localStorage.clear();
    });
    const page = await context.newPage();

    // When I navigate to the "/forecast" page
    await page.goto('/forecast');

    // Then the empty state should be displayed
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-empty')).toBeVisible();

    // And a calendar icon should be visible in the empty state
    await expect(page.getByTestId('forecast-empty').getByTestId('calendar-icon')).toBeVisible();

    // And the empty state message should be visible
    await expect(page.getByTestId('forecast-empty')).toContainText('No 7-day forecast available');

    // And a "Go to Home" button should be visible
    await expect(page.getByTestId('forecast-empty').getByTestId('go-home-button')).toBeVisible();

    // When I tap the "Go to Home" button
    await page.getByTestId('forecast-empty').getByTestId('go-home-button').click();

    // Then the browser should navigate to the "/home" page
    await expect(page).toHaveURL(/\/home$/);

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // And I select the "Kayaking" activity pill
    await page.getByTestId('activity-kayaking').click();

    // Then the empty state should be displayed
    await expect(page.getByTestId('forecast-empty')).toBeVisible();

    // When I tap the "Go to Home" button
    await page.getByTestId('forecast-empty').getByTestId('go-home-button').click();

    // Then the browser should navigate to the "/home" page
    await expect(page).toHaveURL(/\/home$/);

    await context.close();
  });

  // ===========================================================
  // Scenario Group: Routing (FRC-11)
  // ===========================================================

  test('FRC-11: Client-side forecast route loads with localStorage locations', async ({ browser }) => {
    // Given the browser viewport is 1280px
    // And the browser local storage is cleared in context
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    await context.addInitScript(() => {
      localStorage.clear();
    });
    const page = await context.newPage();

    // When I navigate to the "/auckland/home" page
    await page.goto('/auckland/home');

    // And I select the "SUP" activity pill
    await page.getByTestId('activity-sup').click();

    // When I tap the add location (+) button
    await page.getByTestId('add-location-button').click();

    // And I type "Amour Bay" into the search input
    await page.getByTestId('location-search-input').pressSequentially('Amour Bay');

    // And I wait for the search results to appear
    await page.waitForSelector('[data-testid="search-results"]');

    // And I select the first result "Amour Bay"
    await page.getByTestId('search-results').getByTestId('suggestion-item').first().click();

    // And I tap the "7-Day Forecast" sidebar menu item below "Home"
    await page.getByTestId('app-sidebar').getByTestId('app-sidebar-menu-button').filter({ hasText: '7-Day Forecast' }).click();

    // Then 7 day cards should be displayed
    await expect(page.getByTestId('forecast-cards').getByTestId('forecast-day-card')).toHaveCount(7);

    await context.close();
  });

  // ===========================================================
  // Scenario Group: Keyboard Accessibility (FRC-12)
  // ===========================================================

  test('FRC-12: Day cards are keyboard accessible', async ({ browser }) => {
    // Given the browser viewport is 375px
    // And the browser locale is set to en-NZ in context
    const context = await browser.newContext({
      locale: 'en-NZ',
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');
    await page.waitForLoadState('networkidle');

    // And I use Tab to navigate to the first day card
    // Tab order: Back link (1), activity pills (2-5), day selector buttons (6-12), first day card (13)
    for (let i = 0; i < 13; i++) {
      await page.keyboard.press('Tab');
    }

    // Then the first day card should receive focus
    const hasFocus = await page.getByTestId('forecast-cards').getByTestId('forecast-day-card').first().evaluate(
      (el) => document.activeElement === el,
    );
    expect(hasFocus).toBe(true);

    // When I press Enter on the focused day card
    await page.keyboard.press('Enter');

    // Then the browser should navigate to the "/auckland/home" page with the Day 1 date from today selected
    await page.waitForURL(/\/auckland\/home/);
    await expect(page).toHaveURL(/\/auckland\/home/);

    const today = new Date();
    const day1Label = today.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(page.getByTestId('time-window-picker').getByTestId('pick-date-button')).toContainText(day1Label);

    await context.close();
  });

  // ===========================================================
  // Scenario Group: Keyboard Accessibility (FRC-13)
  // ===========================================================

  test('FRC-13: Day selector strip buttons are keyboard accessible', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // And I use Tab to navigate to the day selector strip
    // Tab order: Back link (1), SUP (2), Kayaking (3), Snorkelling (4), Cycling (5), first day button (6)
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
    }

    // Then focus should land on the first day button
    const firstButtonHasFocus = await page.getByTestId('forecast-day-list').getByTestId('day-selector-strip').getByTestId('day-selector-button').first().evaluate(
      (el) => document.activeElement === el,
    );
    expect(firstButtonHasFocus).toBe(true);

    // When I press Tab to move through the day buttons
    // Then focus should move through each day button in order
    for (let i = 1; i <= 6; i++) {
      await page.keyboard.press('Tab');
      const buttonIndex = await page.evaluate(() => {
        const active = document.activeElement;
        const buttons = Array.from(document.querySelectorAll('[data-testid="day-selector-strip"] [data-testid="day-selector-button"]'));
        return buttons.indexOf(active);
      });
      expect(buttonIndex).toBe(i);
    }

    // When I press Enter on the focused day button (currently on the last day button)
    await page.keyboard.press('Enter');

    // Then the page should smooth-scroll to the corresponding day card
    await expect(page.getByTestId('forecast-day-list').getByTestId('forecast-cards').getByTestId('forecast-day-card').last()).toBeVisible();
  });

  // ===========================================================
  // Scenario Group: Keyboard Accessibility (FRC-14)
  // ===========================================================

  test('FRC-14: Back button is keyboard accessible', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/auckland/forecast" page
    await page.goto('/auckland/forecast');

    // And I use Tab to navigate to the back button
    await page.keyboard.press('Tab');

    // Then the back button should receive focus
    const hasFocus = await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').evaluate(
      (el) => document.activeElement === el,
    );
    expect(hasFocus).toBe(true);

    // When I press Enter on the focused back button
    await page.keyboard.press('Enter');

    // Then the browser should navigate to the "/auckland/home" page
    await expect(page).toHaveURL(/\/auckland\/home/);
  });
});
