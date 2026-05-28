import { expect, test } from '@playwright/test';

// ============================================================
// Helper Functions
// ============================================================

// Background: Given the application is running
// (no special setup needed - app runs at localhost:3000)

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Activity Selector and Time Window Picker', () => {
  // ===========================================================
  // Scenario Group: Activity Selector - Default State and Layout
  // ===========================================================

  test('ATW-01: Activity selector displays all activity pills with SUP selected by default', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the activity selector should be visible
    const activitySelector = page.getByTestId('activity-selector');
    await expect(activitySelector).toBeVisible();

    // And the following activity pills should be displayed in a horizontal row:
    // | label       |
    // | SUP         |
    // | Kayaking    |
    // | Snorkelling |
    // | Cycling     |
    const sup = page.getByTestId('activity-sup');
    const kayaking = page.getByTestId('activity-kayaking');
    const snorkelling = page.getByTestId('activity-snorkelling');
    const cycling = page.getByTestId('activity-cycling');

    await expect(sup).toBeVisible();
    await expect(kayaking).toBeVisible();
    await expect(snorkelling).toBeVisible();
    await expect(cycling).toBeVisible();

    await expect(sup).toHaveText('SUP');
    await expect(kayaking).toHaveText('Kayaking');
    await expect(snorkelling).toHaveText('Snorkelling');
    await expect(cycling).toHaveText('Cycling');

    // Verify all pills are in a horizontal row (same top offset)
    const supBox = await sup.boundingBox();
    const kayakingBox = await kayaking.boundingBox();
    const snorkellingBox = await snorkelling.boundingBox();
    const cyclingBox = await cycling.boundingBox();
    expect(Math.abs(supBox.y - kayakingBox.y)).toBeLessThan(5);
    expect(Math.abs(supBox.y - snorkellingBox.y)).toBeLessThan(5);
    expect(Math.abs(supBox.y - cyclingBox.y)).toBeLessThan(5);

    // And the "SUP" activity pill should have a filled primary background indicating it is selected
    await expect(sup).toHaveAttribute('class', /bg-primary/);

    // And the "Kayaking" activity pill should have an outline/ghost style indicating it is unselected
    await expect(kayaking).toHaveAttribute('class', /bg-secondary/);

    // And the "Snorkelling" activity pill should have an outline/ghost style indicating it is unselected
    await expect(snorkelling).toHaveAttribute('class', /bg-secondary/);

    // And the "Cycling" activity pill should have an outline/ghost style indicating it is unselected
    await expect(cycling).toHaveAttribute('class', /bg-secondary/);
  });

  test('ATW-02: Activity pills wrap to the next line on narrow viewports', async ({ page }) => {
    // Given the browser viewport is 320px
    await page.setViewportSize({ width: 320, height: 568 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the activity selector should be visible
    const activitySelector = page.getByTestId('activity-selector');
    await expect(activitySelector).toBeVisible();

    // And the activity pills that do not fit the viewport width should wrap to the next line
    // Verify the container uses flex-wrap: wrap
    await expect(activitySelector).toHaveCSS('flex-wrap', 'wrap');

    // Verify that not all pills are on the same row (wrapping occurs)
    const sup = page.getByTestId('activity-sup');
    const kayaking = page.getByTestId('activity-kayaking');
    const snorkelling = page.getByTestId('activity-snorkelling');
    const cycling = page.getByTestId('activity-cycling');

    const supBox = await sup.boundingBox();
    const kayakingBox = await kayaking.boundingBox();
    const snorkellingBox = await snorkelling.boundingBox();
    const cyclingBox = await cycling.boundingBox();

    // At 320px, at least one pill should be on a different row (different y position)
    const topValues = [supBox.y, kayakingBox.y, snorkellingBox.y, cyclingBox.y];
    const uniqueTopValues = [...new Set(topValues)];
    expect(uniqueTopValues.length).toBeGreaterThan(1);
  });

  test('ATW-03: Activity pills display in a single row on wider viewports', async ({ page }) => {
    // Given the browser viewport is 768px
    await page.setViewportSize({ width: 768, height: 1024 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the activity selector should be visible
    const activitySelector = page.getByTestId('activity-selector');
    await expect(activitySelector).toBeVisible();

    // And all activity pills should be displayed in a single horizontal row without wrapping
    const sup = page.getByTestId('activity-sup');
    const kayaking = page.getByTestId('activity-kayaking');
    const snorkelling = page.getByTestId('activity-snorkelling');
    const cycling = page.getByTestId('activity-cycling');

    await expect(sup).toBeVisible();
    await expect(kayaking).toBeVisible();
    await expect(snorkelling).toBeVisible();
    await expect(cycling).toBeVisible();

    // Verify all pills are in a single horizontal row (same top offset)
    const supBox = await sup.boundingBox();
    const kayakingBox = await kayaking.boundingBox();
    const snorkellingBox = await snorkelling.boundingBox();
    const cyclingBox = await cycling.boundingBox();

    expect(Math.abs(supBox.y - kayakingBox.y)).toBeLessThan(5);
    expect(Math.abs(supBox.y - snorkellingBox.y)).toBeLessThan(5);
    expect(Math.abs(supBox.y - cyclingBox.y)).toBeLessThan(5);

    // Verify all pills have unique top values count of 1 (no wrapping)
    const topValues = [supBox.y, kayakingBox.y, snorkellingBox.y, cyclingBox.y];
    const uniqueTopValues = [...new Set(topValues.map(Math.round))];
    expect(uniqueTopValues.length).toBe(1);
  });

  // ===========================================================
  // Scenario Group: Activity Selector - Selection Behaviour
  // ===========================================================

  const activities = [
    { activity: 'SUP', testId: 'activity-sup' },
    { activity: 'Kayaking', testId: 'activity-kayaking' },
    { activity: 'Snorkelling', testId: 'activity-snorkelling' },
    { activity: 'Cycling', testId: 'activity-cycling' },
  ];

  for (const { activity, testId } of activities) {
    test(`ATW-04: Selecting the ${activity} activity highlights it and deselects others`, async ({ page }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // When I navigate to the "/home" page
      await page.goto('http://localhost:3000/home');

      // And I tap the "<activity>" activity pill
      const targetPill = page.getByTestId(testId);
      await targetPill.click();

      // Then the "<activity>" activity pill should have a filled primary background indicating it is selected
      await expect(targetPill).toHaveAttribute('class', /bg-primary/);

      // And all other activity pills should have an outline/ghost style indicating they are unselected
      for (const { testId: otherTestId } of activities.filter(a => a.testId !== testId)) {
        const otherPill = page.getByTestId(otherTestId);
        await expect(otherPill).toHaveAttribute('class', /bg-secondary/);
      }
    });
  }

  test('ATW-05: Switching between activities updates the selected state', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the "SUP" activity pill should be selected
    const sup = page.getByTestId('activity-sup');
    const kayaking = page.getByTestId('activity-kayaking');
    const cycling = page.getByTestId('activity-cycling');

    await expect(sup).toHaveAttribute('class', /bg-primary/);

    // When I tap the "Kayaking" activity pill
    await kayaking.click();

    // Then the "Kayaking" activity pill should be selected
    await expect(kayaking).toHaveAttribute('class', /bg-primary/);

    // And the "SUP" activity pill should be unselected
    await expect(sup).toHaveAttribute('class', /bg-secondary/);

    // When I tap the "Cycling" activity pill
    await cycling.click();

    // Then the "Cycling" activity pill should be selected
    await expect(cycling).toHaveAttribute('class', /bg-primary/);

    // And the "Kayaking" activity pill should be unselected
    await expect(kayaking).toHaveAttribute('class', /bg-secondary/);

    // When I reload the page
    await page.reload();

    // Then the "Cycling" activity pill should be selected
    // (the selected activity is persisted to a cookie and restored on reload)
    await expect(page.getByTestId('activity-cycling')).toHaveAttribute('class', /bg-primary/);
  });

  // ===========================================================
  // Scenario Group: Time Window Picker - Default State and Layout
  // ===========================================================

  test('ATW-06: Time window picker displays three day options with Today selected by default', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // Then the time window picker should be visible
    const timeWindowPicker = page.getByTestId('time-window-picker');
    await expect(timeWindowPicker).toBeVisible();

    // And the following day option buttons should be displayed:
    // | label           |
    // | Today: All day  |
    // | Tomorrow        |
    // | Pick date       |
    const todayButton = page.getByTestId('today-button');
    const tomorrowButton = page.getByTestId('tomorrow-button');
    const pickDateButton = page.getByTestId('pick-date-button');

    await expect(todayButton).toBeVisible();
    await expect(todayButton).toHaveText(/Today: All day/);
    await expect(tomorrowButton).toBeVisible();
    await expect(tomorrowButton).toHaveText('Tomorrow');
    await expect(pickDateButton).toBeVisible();
    await expect(pickDateButton).toHaveText('Pick date');

    // And the "Today" day option should be highlighted as selected
    await expect(todayButton).toHaveAttribute('class', /bg-primary/);

    // And the "Tomorrow" day option should have an outline style indicating it is unselected
    await expect(tomorrowButton).toHaveAttribute('class', /bg-secondary/);

    // And the "Pick date" day option should have an outline style indicating it is unselected
    await expect(pickDateButton).toHaveAttribute('class', /bg-secondary/);

    // And the "Today" day option button should display a chevron icon
    await expect(todayButton.locator('svg')).toBeVisible();

    // When I tap the "Today" day option button
    await todayButton.click();

    // Then a dropdown should appear with the following time range options:
    // | label     |
    // | All day   |
    // | Morning   |
    // | Afternoon |
    // | Evening   |
    await expect(page.getByRole('menuitemradio', { name: 'All day' })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'Morning' })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'Afternoon' })).toBeVisible();
    await expect(page.getByRole('menuitemradio', { name: 'Evening' })).toBeVisible();

    // When I press Escape
    await page.keyboard.press('Escape');

    // Then the dropdown should close
    await expect(page.getByRole('menu')).toBeHidden();

    // When I tap the text area of the "Today" day option button away from the chevron
    await todayButton.click();

    // Then the same dropdown should appear with time range options
    await expect(page.getByRole('menu')).toBeVisible();
  });

  // ===========================================================
  // Scenario Group: Time Window Picker - Today and Tomorrow Time Range Selection
  // ===========================================================

  const dayOptions = [
    { day: 'Today', testId: 'today-button' },
    { day: 'Tomorrow', testId: 'tomorrow-button' },
  ];

  const timeRanges = ['All day', 'Morning', 'Afternoon', 'Evening'];

  for (const { day, testId } of dayOptions) {
    for (const timeRange of timeRanges) {
      test(`ATW-07: Selecting ${timeRange} time range for ${day} updates the button label`, async ({ page }) => {
        // When I navigate to the "/home" page
        await page.goto('http://localhost:3000/home');

        // And I tap the "<day>" day option button
        const dayButton = page.getByTestId(testId);
        await dayButton.click();

        // And I select the "<timeRange>" time range option
        const timeRangeOption = page.getByRole('menuitemradio', { name: timeRange });
        await expect(timeRangeOption).toBeVisible();
        await timeRangeOption.click();

        // Then the dropdown should close
        await expect(timeRangeOption).not.toBeVisible();

        // And the "<day>" day option button label should display "<day>: <timeRange>"
        await expect(dayButton).toHaveText(new RegExp(`${day}: ${timeRange}`));
      });
    }
  }

  // ===========================================================
  // Scenario Group: Time Window Picker - Pick Date
  // ===========================================================

  test('ATW-08: Tapping Pick date opens a popover with calendar and time range radio group', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I tap the "Pick date" day option button
    const pickDateButton = page.getByTestId('pick-date-button');
    await pickDateButton.click();

    // Then the "Pick date" day option should be highlighted as selected
    await expect(pickDateButton).toHaveAttribute('class', /bg-primary/);

    // And a popover should appear
    const popover = page.getByRole('dialog');
    await expect(popover).toBeVisible();

    // And the popover should contain a calendar at the top
    const calendar = page.getByTestId('pick-date-calendar');
    await expect(calendar).toBeVisible();

    // And the calendar should allow selecting dates from today through 14 days ahead, which can across 2 months
    // And dates before today should be disabled
    // And dates beyond 14 days from today should be disabled
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 14);
    const beyondMaxDate = new Date(today);
    beyondMaxDate.setDate(today.getDate() + 15);

    // Verify today's date button is enabled
    const todayCalendarButton = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${today.getDate()}$`) });
    await expect(todayCalendarButton.first()).toBeEnabled();

    // Verify a date before today is disabled
    if (today.getDate() > 1) {
      const beforeTodayButton = calendar.locator('table button[disabled]').filter({ hasText: new RegExp(`^${today.getDate() - 1}$`) });
      await expect(beforeTodayButton.first()).toBeVisible();
    }

    // If the 14-day window spans 2 months, navigate to the next month to verify boundary
    if (maxDate.getMonth() !== today.getMonth()) {
      await page.getByRole('button', { name: 'Go to the Next Month' }).click();

      // Verify the last valid date (14 days ahead) is enabled
      const maxDateButton = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${maxDate.getDate()}$`) });
      await expect(maxDateButton.first()).toBeEnabled();

      // Verify a date beyond 14 days is disabled
      const beyondButton = calendar.locator('table button[disabled]').filter({ hasText: new RegExp(`^${beyondMaxDate.getDate()}$`) });
      await expect(beyondButton.first()).toBeVisible();
    } else {
      // All dates within the same month
      const maxDateButton = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${maxDate.getDate()}$`) });
      await expect(maxDateButton.first()).toBeEnabled();

      if (beyondMaxDate.getMonth() === today.getMonth()) {
        const beyondButton = calendar.locator('table button[disabled]').filter({ hasText: new RegExp(`^${beyondMaxDate.getDate()}$`) });
        await expect(beyondButton.first()).toBeVisible();
      }
    }

    // And the popover should contain a radio group below the calendar with the following time range options:
    // | label     |
    // | All day   |
    // | Morning   |
    // | Afternoon |
    // | Evening   |
    const radioGroup = page.getByTestId('pick-date-radio-group');
    await expect(radioGroup).toBeVisible();

    const allDayRadio = radioGroup.getByRole('radio', { name: 'All day' });
    const morningRadio = radioGroup.getByRole('radio', { name: 'Morning' });
    const afternoonRadio = radioGroup.getByRole('radio', { name: 'Afternoon' });
    const eveningRadio = radioGroup.getByRole('radio', { name: 'Evening' });

    await expect(allDayRadio).toBeVisible();
    await expect(morningRadio).toBeVisible();
    await expect(afternoonRadio).toBeVisible();
    await expect(eveningRadio).toBeVisible();

    // And the "All day" radio option should be selected by default
    await expect(allDayRadio).toBeChecked();
    await expect(morningRadio).not.toBeChecked();
    await expect(afternoonRadio).not.toBeChecked();
    await expect(eveningRadio).not.toBeChecked();
  });

  test('ATW-09: Selecting a date and time range in Pick date updates the button label', async ({ browser }) => {
    // Given the browser viewport is 375px
    // And the browser locale is "en-NZ"
    const context = await browser.newContext({
      locale: 'en-NZ',
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I tap the "Pick date" day option button
    const pickDateButton = page.getByTestId('pick-date-button');
    await pickDateButton.click();

    // And I select a date 3 days from today in the calendar
    const calendar = page.getByTestId('pick-date-calendar');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3);
    const targetDay = targetDate.getDate();
    const dateButton = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${targetDay}$`) });
    await dateButton.first().click();

    // And I select the "Morning" radio option in the time range group
    const radioGroup = page.getByTestId('pick-date-radio-group');
    const morningRadio = radioGroup.getByRole('radio', { name: 'Morning' });
    await morningRadio.click();

    // Then the "Pick date" day option button should display the selected date
    // formatted with the browser locale and the time range (e.g. "14 Feb: Morning")
    const expectedDateLabel = targetDate.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(pickDateButton).toHaveText(new RegExp(`${expectedDateLabel}: Morning`));

    await context.close();
  });

  test('ATW-10: Tapping the picked date button re-opens the popover to change selection', async ({ browser }) => {
    // Given the browser locale is "en-NZ"
    const context = await browser.newContext({
      locale: 'en-NZ',
    });
    const page = await context.newPage();

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I tap the "Pick date" day option button
    const pickDateButton = page.getByTestId('pick-date-button');
    await pickDateButton.click();

    // And I select a date 2 days from today in the calendar
    const calendar = page.getByTestId('pick-date-calendar');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date2Days = new Date(today);
    date2Days.setDate(today.getDate() + 2);
    const day2 = date2Days.getDate();
    const dateButton2 = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${day2}$`) });
    await dateButton2.first().click();

    // And I select the "Evening" radio option in the time range group
    const radioGroup = page.getByTestId('pick-date-radio-group');
    await radioGroup.getByRole('radio', { name: 'Evening' }).click();

    // And I close the popover
    await page.keyboard.press('Escape');

    // Then the "Pick date" button should display the chosen date and time range
    const expectedLabel2 = date2Days.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(pickDateButton).toContainText(`${expectedLabel2}: Evening`);

    // When I tap the "Pick date" day option button again
    await pickDateButton.click();

    // Then the popover should re-open
    await expect(page.getByRole('dialog')).toBeVisible();

    // And the date 2 days from today should be selected in the calendar
    const selectedCell = calendar.getByRole('gridcell', { selected: true });
    await expect(selectedCell).toContainText(`${day2}`);

    // And the "Evening" radio option should be selected
    await expect(radioGroup.getByRole('radio', { name: 'Evening' })).toBeChecked();

    // When I select a date 4 days from today in the calendar
    const date4Days = new Date(today);
    date4Days.setDate(today.getDate() + 4);
    const day4 = date4Days.getDate();
    const dateButton4 = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${day4}$`) });
    await dateButton4.first().click();

    // And I select the "All day" radio option
    await radioGroup.getByRole('radio', { name: 'All day' }).click();

    // And I close the popover
    await page.keyboard.press('Escape');

    // Then the "Pick date" button should display the newly chosen date with "All day"
    const expectedLabel4 = date4Days.toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' });
    await expect(pickDateButton).toContainText(`${expectedLabel4}: All day`);

    await context.close();
  });

  // ===========================================================
  // Scenario Group: Day Option Switching
  // ===========================================================

  test('ATW-11: Switching from Pick date back to Today resets to Today default', async ({ browser }) => {
    // Given the browser viewport is 375px
    // And the browser locale is "en-US"
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I tap the "Pick date" day option button
    const pickDateButton = page.getByTestId('pick-date-button');
    await pickDateButton.click();

    // And I select a date 3 days from today in the calendar
    const calendar = page.getByTestId('pick-date-calendar');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 3);
    const targetDay = targetDate.getDate();
    const dateButton = calendar.locator('table button:not([disabled])').filter({ hasText: new RegExp(`^${targetDay}$`) });
    await dateButton.first().click();

    // And I select the "Morning" radio option in the time range group
    const radioGroup = page.getByTestId('pick-date-radio-group');
    const morningRadio = radioGroup.getByRole('radio', { name: 'Morning' });
    await morningRadio.click();

    // And I close the popover
    await page.keyboard.press('Escape');

    // Then the "Pick date" button should display the chosen date and "Morning"
    const expectedDateLabel = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    await expect(pickDateButton).toHaveText(new RegExp(`${expectedDateLabel}: Morning`));

    // When I tap the "Today" day option button
    const todayButton = page.getByTestId('today-button');
    await todayButton.click();

    // Then the "Today" day option should be highlighted as selected
    await expect(todayButton).toHaveAttribute('class', /bg-primary/);

    // And the "Pick date" day option should have an outline style indicating it is unselected
    await expect(pickDateButton).toHaveAttribute('class', /bg-secondary/);

    // And a dropdown should appear with time range options for Today
    const allDayOption = page.getByRole('menuitemradio', { name: 'All day' });
    const morningOption = page.getByRole('menuitemradio', { name: 'Morning' });
    const afternoonOption = page.getByRole('menuitemradio', { name: 'Afternoon' });
    const eveningOption = page.getByRole('menuitemradio', { name: 'Evening' });

    await expect(allDayOption).toBeVisible();
    await expect(morningOption).toBeVisible();
    await expect(afternoonOption).toBeVisible();
    await expect(eveningOption).toBeVisible();

    await context.close();
  });

  test('ATW-12: Switching between Today and Tomorrow preserves each option\'s time range independently', async ({ page }) => {
    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I tap the "Today" day option button
    const todayButton = page.getByTestId('today-button');
    await todayButton.click();

    // And I select the "Morning" time range option
    await page.getByRole('menuitemradio', { name: 'Morning' }).click();

    // Then the "Today" button label should display "Today: Morning"
    await expect(todayButton).toHaveText(/Today: Morning/);

    // When I tap the "Tomorrow" day option button
    const tomorrowButton = page.getByTestId('tomorrow-button');
    await tomorrowButton.click();

    // Then the "Tomorrow" button label should display "Tomorrow: Morning"
    await expect(tomorrowButton).toHaveText(/Tomorrow: Morning/);

    // And the "Tomorrow" day option should be expanded
    await expect(tomorrowButton).toHaveAttribute('aria-expanded', 'true');

    // When I select the "Evening" time range option
    await page.getByRole('menuitemradio', { name: 'Evening' }).click();

    // Then the "Tomorrow" button label should display "Tomorrow: Evening"
    await expect(tomorrowButton).toHaveText(/Tomorrow: Evening/);

    // When I tap the "Today" day option button
    await todayButton.click();

    // Then the "Today" button label should display "Today: Evening"
    await expect(todayButton).toHaveText(/Today: Evening/);

    // And the "Today" day option should be highlighted as selected
    await expect(todayButton).toHaveAttribute('class', /bg-primary/);
  });

  // ===========================================================
  // Scenario Group: Responsive Behaviour
  // ===========================================================

  const responsiveWidths = [768, 1024, 1280];

  for (const width of responsiveWidths) {
    test(`ATW-13: Activity selector and time window picker display correctly for browser width ${width}px`, async ({ page }) => {
      // Given the browser viewport is <width>
      await page.setViewportSize({ width, height: 1024 });

      // When I navigate to the "/home" page
      await page.goto('http://localhost:3000/home');

      // Then the activity selector should be visible with all activity pills in a single row
      const activitySelector = page.getByTestId('activity-selector');
      await expect(activitySelector).toBeVisible();

      const sup = page.getByTestId('activity-sup');
      const kayaking = page.getByTestId('activity-kayaking');
      const snorkelling = page.getByTestId('activity-snorkelling');
      const cycling = page.getByTestId('activity-cycling');

      await expect(sup).toBeVisible();
      await expect(kayaking).toBeVisible();
      await expect(snorkelling).toBeVisible();
      await expect(cycling).toBeVisible();

      // Verify all pills are in a single row (same Y coordinate)
      const supBox = await sup.boundingBox();
      const kayakingBox = await kayaking.boundingBox();
      const snorkellingBox = await snorkelling.boundingBox();
      const cyclingBox = await cycling.boundingBox();

      expect(Math.abs(supBox.y - kayakingBox.y)).toBeLessThan(5);
      expect(Math.abs(supBox.y - snorkellingBox.y)).toBeLessThan(5);
      expect(Math.abs(supBox.y - cyclingBox.y)).toBeLessThan(5);

      // And the time window picker should be visible with all day option buttons displayed
      const timeWindowPicker = page.getByTestId('time-window-picker');
      await expect(timeWindowPicker).toBeVisible();

      const todayButton = page.getByTestId('today-button');
      const tomorrowButton = page.getByTestId('tomorrow-button');
      const pickDateButton = page.getByTestId('pick-date-button');

      await expect(todayButton).toBeVisible();
      await expect(tomorrowButton).toBeVisible();
      await expect(pickDateButton).toBeVisible();

      // And the "SUP" activity pill should be selected by default
      await expect(sup).toHaveAttribute('class', /bg-primary/);
      await expect(kayaking).toHaveAttribute('class', /bg-secondary/);
      await expect(snorkelling).toHaveAttribute('class', /bg-secondary/);
      await expect(cycling).toHaveAttribute('class', /bg-secondary/);

      // And the "Today" day option should display "Today: All day" and be selected by default
      await expect(todayButton).toHaveText(/Today: All day/);
      await expect(todayButton).toHaveAttribute('class', /bg-primary/);
      await expect(tomorrowButton).toHaveAttribute('class', /bg-secondary/);
      await expect(pickDateButton).toHaveAttribute('class', /bg-secondary/);
    });
  }

  // ===========================================================
  // Scenario Group: Keyboard Accessibility
  // ===========================================================

  test('ATW-14: Activity pills are keyboard navigable', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I use Tab to navigate to the activity selector
    // Tab 1: Toggle Sidebar button, Tab 2: first activity pill (SUP)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Then focus should land on the first activity pill "SUP"
    await expect(page.getByTestId('activity-sup')).toBeFocused();

    // When I press Tab to move through the activity pills
    // Then focus should move through each activity pill in order: SUP, Kayaking, Snorkelling, Cycling
    await page.keyboard.press('Tab');
    await expect(page.getByTestId('activity-kayaking')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('activity-snorkelling')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByTestId('activity-cycling')).toBeFocused();

    // When I focus the "Kayaking" activity pill and press Enter
    await page.getByTestId('activity-kayaking').focus();
    await page.keyboard.press('Enter');

    // Then the "Kayaking" activity pill should become selected
    await expect(page.getByTestId('activity-kayaking')).toHaveAttribute('data-variant', 'default');

    // And the "SUP" activity pill should become unselected
    await expect(page.getByTestId('activity-sup')).toHaveAttribute('data-variant', 'secondary');
  });

  test('ATW-15: Today and Tomorrow dropdown is keyboard accessible', async ({ page }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I use Tab to navigate to the "Today" day option button
    // Tab order at 375px: Toggle Sidebar -> SUP -> Kayaking -> Snorkelling -> Cycling -> Today
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press('Tab');
    }
    await expect(page.getByTestId('today-button')).toBeFocused();

    // And I press Enter on the "Today" day option button
    await page.keyboard.press('Enter');

    // Then the time range dropdown should open
    await expect(page.getByRole('menu')).toBeVisible();

    // When I use arrow keys to navigate to "Morning"
    // Focus starts on "All day" (checked), ArrowDown moves to "Morning"
    await page.keyboard.press('ArrowDown');

    // And I wait until the "Morning" time range option is focused
    await expect(page.getByRole('menuitemradio', { name: 'Morning' })).toBeFocused();

    // And I press Enter to select "Morning"
    await page.keyboard.press('Enter');

    // Then the dropdown should close
    await expect(page.getByRole('menu')).toBeHidden();

    // And the "Today" button label should display "Today: Morning"
    await expect(page.getByTestId('today-button')).toHaveText(/Today: Morning/);
  });

  test('ATW-16: Pick date popover is keyboard accessible', async ({ browser }) => {
    // Given the browser viewport is 1280px
    // And the browser locale is "en-US"
    const context = await browser.newContext({
      locale: 'en-US',
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();

    // When I navigate to the "/home" page
    await page.goto('http://localhost:3000/home');

    // And I focus on the "Pick date" day option button
    await page.getByTestId('pick-date-button').evaluate((el) => el.focus());

    // And I press Enter on the "Pick date" day option button
    await page.keyboard.press('Enter');

    // Then a popover should open with the calendar
    await expect(page.getByRole('dialog')).toBeVisible();

    // When I focus on today in the calendar
    const calendar = page.getByTestId('pick-date-calendar');
    await calendar.getByRole('button', { name: /Today/ }).evaluate((el) => el.focus());

    // And I use arrow keys to navigate to 2 days from today in the calendar
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');

    // And I press Enter to select a date
    await page.keyboard.press('Enter');

    // And I use Tab to navigate to the radio group
    await page.keyboard.press('Tab');

    // And I hold ArrowDown key down
    await page.keyboard.down('ArrowDown');

    // And I wait until the "Morning" radio option is checked
    await expect(page.getByRole('radio', { name: 'Morning' })).toBeChecked();

    // And I release the ArrowDown key up
    await page.keyboard.up('ArrowDown');

    // When I press Escape
    await page.keyboard.press('Escape');

    // Then the popover should close
    await expect(page.getByRole('dialog')).toBeHidden();

    // And the "Pick date" button should display the chosen date and the "Morning" time range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + 2);
    const expectedDateLabel = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    await expect(page.getByTestId('pick-date-button')).toHaveText(new RegExp(`${expectedDateLabel}: Morning`));

    await context.close();
  });
});
