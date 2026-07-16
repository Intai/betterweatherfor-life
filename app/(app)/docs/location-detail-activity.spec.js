import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Location Detail Activity Naming', () => {
  // ----------------------------------------------------------
  // Scenario Group: Conditions Heading Names the Selected Activity
  // ----------------------------------------------------------

  [
    { activity: 'sup', activityLabel: 'SUP', url: '/location/mission-bay/-36.8547,174.8317' },
    { activity: 'kayaking', activityLabel: 'Kayaking', url: '/location/bondi-beach/-33.8915,151.2767' },
    { activity: 'snorkelling', activityLabel: 'Snorkelling', url: '/location/goat-island/-36.2675,174.7936' },
    { activity: 'cycling', activityLabel: 'Cycling', url: '/location/piha-beach/-36.9553,174.4681' },
  ].forEach(({ activity, activityLabel, url }) => {
    test(`LDA-01: Conditions heading names the ${activityLabel} activity the forecast is tailored to @purge-data`, async ({ page, context }) => {
      // @purge-data - Restore the seed data to initial state (runs FIRST)
      execSync('make reseed', { stdio: 'inherit' });

      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // And the browser cookie "selectedActivity" is set to "<activity>" in context
      await context.addCookies([
        { name: 'selectedActivity', value: activity, domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "<url>" page
      await page.goto(`http://localhost:3000${url}`);

      // Then the conditions section should be visible
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section'),
      ).toBeVisible();

      // And the heading "Conditions for <activityLabel>" should be visible in the conditions section
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: `Conditions for ${activityLabel}` }),
      ).toBeVisible();

      // And the heading should use the localized "home.activities.<activity>" label "<activityLabel>" for the activity name
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: `Conditions for ${activityLabel}` }),
      ).toContainText(activityLabel);

      // And the plain heading "Conditions" without an activity name should not be visible
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: 'Conditions', exact: true }),
      ).toBeHidden();
    });
  });

  // ----------------------------------------------------------
  // Scenario Group: Conditions Heading Reacts to the Forecast Store Selection
  // ----------------------------------------------------------

  test('LDA-02: Conditions heading updates when the selected activity changes in the forecast store', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "sup" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    await page.goto('http://localhost:3000/location/mission-bay/-36.8547,174.8317');

    // Then the heading "Conditions for SUP" should be visible in the conditions section
    await expect(
      page.getByTestId('location-detail').getByTestId('conditions-section')
        .getByRole('heading', { name: 'Conditions for SUP' }),
    ).toBeVisible();

    // When the browser cookie "selectedActivity" is set to "cycling" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'cycling', domain: 'localhost', path: '/' },
    ]);

    // And I navigate to the "/location/piha-beach/-36.9553,174.4681" page
    await page.goto('http://localhost:3000/location/piha-beach/-36.9553,174.4681');

    // Then the heading "Conditions for Cycling" should be visible in the conditions section
    await expect(
      page.getByTestId('location-detail').getByTestId('conditions-section')
        .getByRole('heading', { name: 'Conditions for Cycling' }),
    ).toBeVisible();

    // And the heading "Conditions for SUP" should not be visible
    await expect(
      page.getByTestId('location-detail').getByTestId('conditions-section')
        .getByRole('heading', { name: 'Conditions for SUP' }),
    ).toBeHidden();

    // When the browser cookie "selectedActivity" is set to "snorkelling" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'snorkelling', domain: 'localhost', path: '/' },
    ]);

    // And I navigate to the "/location/goat-island/-36.2675,174.7936" page
    await page.goto('http://localhost:3000/location/goat-island/-36.2675,174.7936');

    // Then the heading "Conditions for Snorkelling" should be visible in the conditions section
    await expect(
      page.getByTestId('location-detail').getByTestId('conditions-section')
        .getByRole('heading', { name: 'Conditions for Snorkelling' }),
    ).toBeVisible();

    // And the heading "Conditions for Cycling" should not be visible
    await expect(
      page.getByTestId('location-detail').getByTestId('conditions-section')
        .getByRole('heading', { name: 'Conditions for Cycling' }),
    ).toBeHidden();
  });

  // ----------------------------------------------------------
  // Scenario Group: Score Card Best-Conditions Line Has No Activity Name
  // ----------------------------------------------------------

  [
    { width: 768, activity: 'sup', activityLabel: 'SUP', name: 'Mission Bay', url: '/location/mission-bay/-36.8547,174.8317', bestHour: 'Best conditions at 09:00' },
    { width: 1024, activity: 'sup', activityLabel: 'SUP', name: 'St Heliers', url: '/location/st-heliers-bay/-36.8508,174.8593', bestHour: 'Better conditions at 06:00' },
    { width: 1280, activity: 'cycling', activityLabel: 'Cycling', name: 'Piha Beach', url: '/location/piha-beach/-36.9553,174.4681', bestHour: 'Better conditions at 19:00' },
  ].forEach(({ width, activity, activityLabel, name, url, bestHour }) => {
    test(`LDA-03: Score card best-conditions line stays free of an activity name for ${name}`, async ({ page, context }) => {
      // Given the browser viewport is <width>
      await page.setViewportSize({ width, height: 1024 });

      // And the browser cookie "selectedActivity" is set to "<activity>" in context
      await context.addCookies([
        { name: 'selectedActivity', value: activity, domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "<url>" page
      await page.goto(`http://localhost:3000${url}`);

      // Then the score card best-hour line should be visible
      await expect(
        page.getByTestId('location-detail').getByTestId('best-hour'),
      ).toBeVisible();

      // And the score card best-hour line should read "<bestHour>"
      await expect(
        page.getByTestId('location-detail').getByTestId('best-hour'),
      ).toHaveText(bestHour);

      // And the score card best-hour line should not contain the activity name "<activityLabel>"
      await expect(
        page.getByTestId('location-detail').getByTestId('best-hour'),
      ).not.toContainText(activityLabel);
    });
  });
});
