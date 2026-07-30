import { chromium, expect, test } from '@playwright/test';
import { PlaywrightVisualRegressionTracker } from '@visual-regression-tracker/agent-playwright';
import { execSync } from 'child_process';
import { ignoreAreasOf } from './vrt-ignore-areas.js';

// ============================================================
// Visual Regression Tracking
// ============================================================

// Track only when the VRT backend is fully configured; otherwise the spec runs unchanged
const isVrtEnabled = Boolean(
  process.env.VRT_APIURL &&
    process.env.VRT_APIKEY &&
    process.env.VRT_PROJECT &&
    process.env.VRT_BRANCHNAME,
);

// Reads VRT_APIURL / VRT_PROJECT / VRT_APIKEY / VRT_BRANCHNAME / VRT_CIBUILDID / VRT_ENABLESOFTASSERT
const vrt = isVrtEnabled ? new PlaywrightVisualRegressionTracker(chromium.name()) : null;

// page.screenshot() defaults to animations: 'allow', unlike toHaveScreenshot()
const DEFAULT_SCREENSHOT_OPTIONS = { animations: 'disabled' };

function withScreenshotDefaults(options) {
  return {
    ...options,
    screenshotOptions: { ...DEFAULT_SCREENSHOT_OPTIONS, ...options?.screenshotOptions },
  };
}

async function trackVisualPage(page, name, options) {
  if (!vrt) return;
  await vrt.trackPage(page, name, withScreenshotDefaults(options));
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Location Detail Activity Naming', () => {
  test.beforeAll(async () => { if (vrt) await vrt.start(); });
  test.afterAll(async () => { if (vrt) await vrt.stop(); });

  // ----------------------------------------------------------
  // Scenario Group: Conditions Heading Names the Selected Activity
  // ----------------------------------------------------------

  [
    {
      activity: 'sup',
      activityLabel: 'SUP',
      url: '/location/mission-bay/-36.8547,174.8317',
      vrtNames: {
        conditionsSection: 'LDA-01-sup-the-conditions-section-should-be-visible',
        headingVisible: 'LDA-01-sup-the-heading-conditions-for-sup-should-be-visible-in-the-conditions-section',
        localizedLabel: 'LDA-01-sup-the-heading-should-use-the-localized-home-activities-sup-label-sup-for-the',
        plainHeading: 'LDA-01-sup-the-plain-heading-conditions-without-an-activity-name-should-not-be-visible',
      },
    },
    {
      activity: 'kayaking',
      activityLabel: 'Kayaking',
      url: '/location/bondi-beach/-33.8915,151.2767',
      vrtNames: {
        conditionsSection: 'LDA-01-kayaking-the-conditions-section-should-be-visible',
        headingVisible: 'LDA-01-kayaking-the-heading-conditions-for-kayaking-should-be-visible-in-the-conditions-section',
        localizedLabel: 'LDA-01-kayaking-the-heading-should-use-the-localized-home-activities-kayaking-label-kayaking-for',
        plainHeading: 'LDA-01-kayaking-the-plain-heading-conditions-without-an-activity-name-should-not-be-visible',
      },
    },
    {
      activity: 'snorkelling',
      activityLabel: 'Snorkelling',
      url: '/location/goat-island/-36.2675,174.7936',
      vrtNames: {
        conditionsSection: 'LDA-01-snorkelling-the-conditions-section-should-be-visible',
        headingVisible: 'LDA-01-snorkelling-the-heading-conditions-for-snorkelling-should-be-visible-in-the-conditions',
        localizedLabel: 'LDA-01-snorkelling-the-heading-should-use-the-localized-home-activities-snorkelling-label',
        plainHeading: 'LDA-01-snorkelling-the-plain-heading-conditions-without-an-activity-name-should-not-be-visible',
      },
    },
    {
      activity: 'cycling',
      activityLabel: 'Cycling',
      url: '/location/piha-beach/-36.9553,174.4681',
      vrtNames: {
        conditionsSection: 'LDA-01-cycling-the-conditions-section-should-be-visible',
        headingVisible: 'LDA-01-cycling-the-heading-conditions-for-cycling-should-be-visible-in-the-conditions-section',
        localizedLabel: 'LDA-01-cycling-the-heading-should-use-the-localized-home-activities-cycling-label-cycling-for',
        plainHeading: 'LDA-01-cycling-the-plain-heading-conditions-without-an-activity-name-should-not-be-visible',
      },
    },
  ].forEach(({ activity, activityLabel, url, vrtNames }) => {
    test(`LDA-01: Conditions heading names the ${activityLabel} activity the forecast is tailored to @purge-data @screenshots`, async ({ page, context }) => {
      // @purge-data - Restore the seed data to initial state (runs FIRST)
      execSync('make reseed', { stdio: 'inherit' });

      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // And the browser cookie "selectedActivity" is set to "<activity>" in context
      await context.addCookies([
        { name: 'selectedActivity', value: activity, domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "<url>" page
      await page.goto(url);

      // Then the conditions section should be visible
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section'),
      ).toBeVisible();
      await trackVisualPage(page, vrtNames.conditionsSection, {
        ignoreAreas: await ignoreAreasOf(page, ['forecast-date'], { paddingX: 36 }),
      });

      // And the heading "Conditions for <activityLabel>" should be visible in the conditions section
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: `Conditions for ${activityLabel}` }),
      ).toBeVisible();
      await trackVisualPage(page, vrtNames.headingVisible, {
        ignoreAreas: await ignoreAreasOf(page, ['forecast-date'], { paddingX: 36 }),
      });

      // And the heading should use the localized "home.activities.<activity>" label "<activityLabel>" for the activity name
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: `Conditions for ${activityLabel}` }),
      ).toContainText(activityLabel);
      await trackVisualPage(page, vrtNames.localizedLabel, {
        ignoreAreas: await ignoreAreasOf(page, ['forecast-date'], { paddingX: 36 }),
      });

      // And the plain heading "Conditions" without an activity name should not be visible
      await expect(
        page.getByTestId('location-detail').getByTestId('conditions-section')
          .getByRole('heading', { name: 'Conditions', exact: true }),
      ).toBeHidden();
      await trackVisualPage(page, vrtNames.plainHeading, {
        ignoreAreas: await ignoreAreasOf(page, ['forecast-date'], { paddingX: 36 }),
      });
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
    await page.goto('/location/mission-bay/-36.8547,174.8317');

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
    await page.goto('/location/piha-beach/-36.9553,174.4681');

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
    await page.goto('/location/goat-island/-36.2675,174.7936');

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
      await page.goto(url);

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
