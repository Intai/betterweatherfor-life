import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

async function setupBackground(page) {
  // Background: navigate to home page with default SUP activity and Today/All day
  await page.goto('http://localhost:3000/auckland/home');
  await page.waitForLoadState('networkidle');
}

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: Location Detail Page', () => {
  test('LDP-01: Sticky header displays location name and back button', async ({ page }) => {
    // @purge-data - Restore the seed data to initial state
    execSync('make reseed', { stdio: 'inherit' });

    // Set viewport to 375px mobile
    await page.setViewportSize({ width: 375, height: 812 });

    // Background
    await setupBackground(page);

    // When I navigate to the "/auckland/home" page
    // (already done in background)

    // And I tap the "Mission Bay" location card
    await page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ }).click();

    // Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    await expect(page).toHaveURL(/\/location\/mission-bay\/-36\.8547,174\.8317/);

    // And the top appbar should be sticky at the top of the viewport
    const appbarStyle = await page.getByTestId('top-appbar-mobile-sub').evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { position: s.position, top: s.top };
    });
    expect(appbarStyle.position).toBe('sticky');
    expect(appbarStyle.top).toBe('0px');

    // And the top appbar should display the page title "Mission Bay"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('Mission Bay');

    // And the back button should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back')).toBeVisible();

    // And the back button should be styled left-aligned
    const backLeftAligned = await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return r.left <= 20;
    });
    expect(backLeftAligned).toBe(true);

    // And the share button should be visible
    await expect(page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-share')).toBeVisible();

    // And the share button should be styled right-aligned
    const shareRightAligned = await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-share').evaluate((el) => {
      const r = el.getBoundingClientRect();
      const pr = el.parentElement.getBoundingClientRect();
      return pr.right - r.right <= 20;
    });
    expect(shareRightAligned).toBe(true);

    // When I tap the share icon in the top app bar
    // First mock navigator.share
    await page.evaluate(() => {
      window.__shareCalledWith = null;
      navigator.share = (data) => {
        window.__shareCalledWith = data;
        return Promise.resolve();
      };
    });
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-share').click();

    // Then navigator.share should be called with the current URL and "Mission Bay" as the title
    const shareData = await page.evaluate(() => window.__shareCalledWith);
    expect(shareData).toBeTruthy();
    expect(shareData.title).toContain('Mission Bay');
    expect(shareData.url).toContain('/location/mission-bay/-36.8547,174.8317');

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/);
  });

  [
    { activity: 'sup', name: 'Mission Bay', url: '/location/mission-bay/-36.8547,174.8317', score: '85', theme: 'condition-ideal', badge: 'Ideal', bestHour: '09:00' },
    { activity: 'sup', name: 'Takapuna Beach', url: '/location/takapuna-beach/-36.7878,174.7768', score: '62', theme: 'condition-acceptable', badge: 'Acceptable', bestHour: '08:00' },
    { activity: 'sup', name: 'St Heliers Bay', url: '/location/st-heliers-bay/-36.8508,174.8593', score: '58', theme: 'condition-marginal', badge: 'Marginal', bestHour: '06:00' },
    { activity: 'cycling', name: 'Piha Beach', url: '/location/piha-beach/-36.9553,174.4681', score: '25', theme: 'condition-unsuitable', badge: 'Unsuitable', bestHour: '19:00' },
  ].forEach(({ activity, name, url, score, theme, badge, bestHour }) => {
    test(`LDP-02: Large circular score displays score, condition, and best hour for ${name}`, async ({ page, context }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // And the browser cookie "selectedActivity" is set to "<activity>" in context
      await context.addCookies([
        { name: 'selectedActivity', value: activity, domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "<url>" page
      await page.goto(`http://localhost:3000${url}`);

      // Then the page title metadata should contain "<name>"
      await expect(page).toHaveTitle(new RegExp(name));

      // And a large circular score display should be visible
      await expect(page.getByTestId('score-circle')).toBeVisible();

      // And the score circle should display "<score>"
      await expect(page.getByTestId('score-circle')).toContainText(score);

      // And the score circle should use the "<theme>" background colour
      const hasThemeClass = await page.getByTestId('score-circle').evaluate(
        (el, t) => el.classList.contains(`bg-${t}`),
        theme,
      );
      expect(hasThemeClass).toBe(true);

      // And a condition badge pill "<badge>" should be displayed below the score
      await expect(page.getByTestId('location-detail').getByTestId('score-badge')).toHaveText(badge);

      // And the subtitle "Best conditions at <bestHour>" should be visible
      await expect(page.getByTestId('location-detail')).toContainText(`Best conditions at ${bestHour}`);
    });
  });

  test('LDP-03: Conditions heading and factor cards are displayed for each non-null factor', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "sup" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    await page.goto('http://localhost:3000/location/mission-bay/-36.8547,174.8317');

    // Then the heading "Conditions" should be visible
    await expect(page.getByTestId('conditions-section').getByRole('heading', { name: 'Conditions' })).toBeVisible();

    // And the following factor cards should be displayed in a vertical stack: Wind, Tide, Water, Temp, UV Index, Daylight
    const expectedCards = ['factor-card-wind', 'factor-card-tide', 'factor-card-water', 'factor-card-temp', 'factor-card-uv', 'factor-card-daylight'];
    for (const testid of expectedCards) {
      await expect(page.getByTestId(testid)).toBeVisible();
    }
    const tops = await page.getByTestId('conditions-section').evaluate((section) => {
      return ['factor-card-wind', 'factor-card-tide', 'factor-card-water', 'factor-card-temp', 'factor-card-uv', 'factor-card-daylight']
        .map((id) => section.querySelector(`[data-testid="${id}"]`).getBoundingClientRect().top);
    });
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }

    // And the following factor cards should not be displayed: Precipitation, Humidity, Visibility
    await expect(page.getByTestId('factor-card-precipitation')).toHaveCount(0);
    await expect(page.getByTestId('factor-card-humidity')).toHaveCount(0);
    await expect(page.getByTestId('factor-card-visibility')).toHaveCount(0);

    // And the "Wind" factor card should display an icon in the ideal color
    const windIconColor = await page.getByTestId('factor-card-wind').getByTestId('factor-icon').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const idealColor = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--condition-ideal').trim();
    });
    // Convert hex to rgb for comparison
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${r}, ${g}, ${b})`;
    };
    expect(windIconColor).toBe(hexToRgb(idealColor));

    // And the "Wind" factor card should display the heading "Wind"
    await expect(page.getByTestId('factor-card-wind')).toContainText('Wind');

    // And the "Wind" factor card data grid should show: Speed 8km/h, Direction NE, Gust 12km/h
    const windGrid = page.getByTestId('factor-card-wind').getByTestId('data-grid');
    await expect(windGrid).toContainText('Speed');
    await expect(windGrid).toContainText('8km/h');
    await expect(windGrid).toContainText('Direction');
    await expect(windGrid).toContainText('NE');
    await expect(windGrid).toContainText('Gust');
    await expect(windGrid).toContainText('12km/h');

    // And the "Tide" factor card data grid should show: State Rising 70%, Next high 10:30, Swell 0.3m
    const tideGrid = page.getByTestId('factor-card-tide').getByTestId('data-grid');
    await expect(tideGrid).toContainText('State');
    await expect(tideGrid).toContainText('Rising 70%');
    await expect(tideGrid).toContainText('Next high');
    await expect(tideGrid).toContainText('10:30');
    await expect(tideGrid).toContainText('Swell');
    await expect(tideGrid).toContainText('0.3m');

    // And the "Water" factor card data grid should show: Quality Green
    const waterGrid = page.getByTestId('factor-card-water').getByTestId('data-grid');
    await expect(waterGrid).toContainText('Quality');
    await expect(waterGrid).toContainText('Green');

    // And the "Temp" factor card data grid should show: Air 22°C, Feels like 24°C, Water 20°C
    const tempGrid = page.getByTestId('factor-card-temp').getByTestId('data-grid');
    await expect(tempGrid).toContainText('Air');
    await expect(tempGrid).toContainText('22°C');
    await expect(tempGrid).toContainText('Feels like');
    await expect(tempGrid).toContainText('24°C');
    await expect(tempGrid).toContainText('Water');
    await expect(tempGrid).toContainText('20°C');

    // And the "UV Index" factor card data grid should show: UV Index 4
    const uvGrid = page.getByTestId('factor-card-uv').getByTestId('data-grid');
    await expect(uvGrid).toContainText('UV Index');
    await expect(uvGrid).toContainText('4');

    // And the "Daylight" factor card data grid should show: Sunset 19:42
    const daylightGrid = page.getByTestId('factor-card-daylight').getByTestId('data-grid');
    await expect(daylightGrid).toContainText('Sunset');
    await expect(daylightGrid).toContainText('19:42');
  });

  test('LDP-04: Conditions heading and factor cards are displayed for snorkelling at Goat Island', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "snorkelling" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'snorkelling', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/goat-island/-36.2675,174.7936" page
    await page.goto('http://localhost:3000/location/goat-island/-36.2675,174.7936');

    // Then the heading "Conditions" should be visible
    await expect(page.getByTestId('conditions-section').getByRole('heading', { name: 'Conditions' })).toBeVisible();

    // And the following factor cards should be displayed in a vertical stack: Wind, Tide, Water, Temp, Precipitation, UV Index, Visibility, Daylight
    const expectedCards = ['factor-card-wind', 'factor-card-tide', 'factor-card-water', 'factor-card-temp', 'factor-card-precipitation', 'factor-card-uv', 'factor-card-visibility', 'factor-card-daylight'];
    for (const testid of expectedCards) {
      await expect(page.getByTestId(testid)).toBeVisible();
    }
    const tops = await page.getByTestId('conditions-section').evaluate((section) => {
      return ['factor-card-wind', 'factor-card-tide', 'factor-card-water', 'factor-card-temp', 'factor-card-precipitation', 'factor-card-uv', 'factor-card-visibility', 'factor-card-daylight']
        .map((id) => section.querySelector(`[data-testid="${id}"]`).getBoundingClientRect().top);
    });
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }

    // And the following factor cards should not be displayed: Humidity
    await expect(page.getByTestId('factor-card-humidity')).toHaveCount(0);

    // And the "Wind" factor card should display an icon in the acceptable color
    const windIconColor = await page.getByTestId('factor-card-wind').getByTestId('factor-icon').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    const acceptableColor = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--condition-acceptable').trim();
    });
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${r}, ${g}, ${b})`;
    };
    expect(windIconColor).toBe(hexToRgb(acceptableColor));

    // And the "Wind" factor card should display the heading "Wind"
    await expect(page.getByTestId('factor-card-wind')).toContainText('Wind');

    // And the "Wind" factor card data grid should show: Speed 10km/h, Direction NE, Gust 14km/h
    const windGrid = page.getByTestId('factor-card-wind').getByTestId('data-grid');
    await expect(windGrid).toContainText('Speed');
    await expect(windGrid).toContainText('10km/h');
    await expect(windGrid).toContainText('Direction');
    await expect(windGrid).toContainText('NE');
    await expect(windGrid).toContainText('Gust');
    await expect(windGrid).toContainText('14km/h');

    // And the "Visibility" factor card data grid should show: Visibility 6m
    const visibilityGrid = page.getByTestId('factor-card-visibility').getByTestId('data-grid');
    await expect(visibilityGrid).toContainText('Visibility');
    await expect(visibilityGrid).toContainText('6m');

    // And the "Water" factor card data grid should show: Quality Green
    const waterGrid = page.getByTestId('factor-card-water').getByTestId('data-grid');
    await expect(waterGrid).toContainText('Quality');
    await expect(waterGrid).toContainText('Green');

    // And the "Tide" factor card data grid should show: State Rising 55%, Next high 11:15, Swell 0.4m
    const tideGrid = page.getByTestId('factor-card-tide').getByTestId('data-grid');
    await expect(tideGrid).toContainText('State');
    await expect(tideGrid).toContainText('Rising 55%');
    await expect(tideGrid).toContainText('Next high');
    await expect(tideGrid).toContainText('11:15');
    await expect(tideGrid).toContainText('Swell');
    await expect(tideGrid).toContainText('0.4m');

    // And the "Temp" factor card data grid should show: Air 23°C, Feels like 22°C, Water 21°C
    const tempGrid = page.getByTestId('factor-card-temp').getByTestId('data-grid');
    await expect(tempGrid).toContainText('Air');
    await expect(tempGrid).toContainText('23°C');
    await expect(tempGrid).toContainText('Feels like');
    await expect(tempGrid).toContainText('22°C');
    await expect(tempGrid).toContainText('Water');
    await expect(tempGrid).toContainText('21°C');

    // And the "Precipitation" factor card data grid should show: Amount 0mm, Chance 10%
    const precipGrid = page.getByTestId('factor-card-precipitation').getByTestId('data-grid');
    await expect(precipGrid).toContainText('Amount');
    await expect(precipGrid).toContainText('0mm');
    await expect(precipGrid).toContainText('Chance');
    await expect(precipGrid).toContainText('10%');

    // And the "UV Index" factor card data grid should show: UV Index 5
    const uvGrid = page.getByTestId('factor-card-uv').getByTestId('data-grid');
    await expect(uvGrid).toContainText('UV Index');
    await expect(uvGrid).toContainText('5');

    // And the "Daylight" factor card data grid should show: Sunset 19:38
    const daylightGrid = page.getByTestId('factor-card-daylight').getByTestId('data-grid');
    await expect(daylightGrid).toContainText('Sunset');
    await expect(daylightGrid).toContainText('19:38');
  });

  test('LDP-05: Conditions heading and factor cards are displayed for cycling at Piha Beach', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "cycling" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'cycling', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/piha-beach/-36.9553,174.4681" page
    await page.goto('http://localhost:3000/location/piha-beach/-36.9553,174.4681');

    // Then the heading "Conditions" should be visible
    await expect(page.getByTestId('conditions-section').getByRole('heading', { name: 'Conditions' })).toBeVisible();

    // And the following factor cards should be displayed in a vertical stack: Wind, Temp, Precipitation, UV Index, Humidity, Daylight
    const expectedCards = ['factor-card-wind', 'factor-card-temp', 'factor-card-precipitation', 'factor-card-uv', 'factor-card-humidity', 'factor-card-daylight'];
    for (const testid of expectedCards) {
      await expect(page.getByTestId(testid)).toBeVisible();
    }
    const tops = await page.getByTestId('conditions-section').evaluate((section) => {
      return ['factor-card-wind', 'factor-card-temp', 'factor-card-precipitation', 'factor-card-uv', 'factor-card-humidity', 'factor-card-daylight']
        .map((id) => section.querySelector(`[data-testid="${id}"]`).getBoundingClientRect().top);
    });
    for (let i = 1; i < tops.length; i++) {
      expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    }

    // And the following factor cards should not be displayed: Tide, Water, Visibility
    await expect(page.getByTestId('factor-card-tide')).toHaveCount(0);
    await expect(page.getByTestId('factor-card-water')).toHaveCount(0);
    await expect(page.getByTestId('factor-card-visibility')).toHaveCount(0);

    // And the "Wind" factor card should display the border, an icon and a condition badge in the unsuitable color
    const unsuitableColor = await page.evaluate(() => {
      return window.getComputedStyle(document.documentElement).getPropertyValue('--condition-unsuitable').trim();
    });
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgb(${r}, ${g}, ${b})`;
    };
    const expectedRgb = hexToRgb(unsuitableColor);

    const windBorderColor = await page.getByTestId('factor-card-wind').evaluate((el) => {
      return window.getComputedStyle(el).borderColor;
    });
    expect(windBorderColor).toBe(expectedRgb);

    const windIconColor = await page.getByTestId('factor-card-wind').getByTestId('factor-icon').evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(windIconColor).toBe(expectedRgb);

    const windBadgeBg = await page.getByTestId('factor-card-wind').getByTestId('condition-badge').evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(windBadgeBg).toBe(expectedRgb);

    // And the "Wind" factor card should display the heading "Wind"
    await expect(page.getByTestId('factor-card-wind')).toContainText('Wind');

    // And the "Wind" factor card data grid should show: Speed 42km/h, Direction SW, Gust 58km/h
    const windGrid = page.getByTestId('factor-card-wind').getByTestId('data-grid');
    await expect(windGrid).toContainText('Speed');
    await expect(windGrid).toContainText('42km/h');
    await expect(windGrid).toContainText('Direction');
    await expect(windGrid).toContainText('SW');
    await expect(windGrid).toContainText('Gust');
    await expect(windGrid).toContainText('58km/h');

    // And the "Temp" factor card data grid should show: Air 14°C, Feels like 8°C
    const tempGrid = page.getByTestId('factor-card-temp').getByTestId('data-grid');
    await expect(tempGrid).toContainText('Air');
    await expect(tempGrid).toContainText('14°C');
    await expect(tempGrid).toContainText('Feels like');
    await expect(tempGrid).toContainText('8°C');

    // And the "Precipitation" factor card data grid should show: Amount 4.2mm, Chance 95%
    const precipGrid = page.getByTestId('factor-card-precipitation').getByTestId('data-grid');
    await expect(precipGrid).toContainText('Amount');
    await expect(precipGrid).toContainText('4.2mm');
    await expect(precipGrid).toContainText('Chance');
    await expect(precipGrid).toContainText('95%');

    // And the "Humidity" factor card data grid should show: Humidity 94%
    const humidityGrid = page.getByTestId('factor-card-humidity').getByTestId('data-grid');
    await expect(humidityGrid).toContainText('Humidity');
    await expect(humidityGrid).toContainText('94%');

    // And the "UV Index" factor card data grid should show: UV Index 2
    const uvGrid = page.getByTestId('factor-card-uv').getByTestId('data-grid');
    await expect(uvGrid).toContainText('UV Index');
    await expect(uvGrid).toContainText('2');

    // And the "Daylight" factor card data grid should show: Civil twilight 20:45
    const daylightGrid = page.getByTestId('factor-card-daylight').getByTestId('data-grid');
    await expect(daylightGrid).toContainText('Civil twilight');
    await expect(daylightGrid).toContainText('20:45');
  });

  test('LDP-06: AI analysis section displays multi-paragraph text in a tinted card', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "sup" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    await page.goto('http://localhost:3000/location/mission-bay/-36.8547,174.8317');

    // Then the heading "AI Analysis" should be visible
    await expect(page.getByTestId('location-detail-analysis').getByRole('heading', { name: 'AI Analysis' })).toBeVisible();

    // And the AI analysis card should be visible
    await expect(page.getByTestId('location-detail-analysis').getByTestId('analysis-card')).toBeVisible();

    // And the AI analysis card should have a subtle tint of the "condition-ideal" colour as background
    const hasTint = await page.getByTestId('location-detail-analysis').getByTestId('analysis-card').evaluate((el) => {
      return el.style.backgroundColor.includes('--condition-ideal');
    });
    expect(hasTint).toBe(true);

    // And the AI analysis card should display 2 paragraphs
    const paragraphs = page.getByTestId('location-detail-analysis').getByTestId('analysis-card').locator('p');
    await expect(paragraphs).toHaveCount(2);

    // Paragraph 1
    await expect(paragraphs.first()).toHaveText(
      'Flat water and light winds make Mission Bay one of the best spots for SUP today. The gentle northeast breeze will help keep you cool without creating chop.',
    );

    // Paragraph 2
    await expect(paragraphs.last()).toHaveText(
      'Tide is rising through the morning, providing a gentle push toward shore. Water quality is excellent with no contamination alerts in effect.',
    );
  });

  [
    { activity: 'sup', name: 'Mission Bay', url: '/location/mission-bay/-36.8547,174.8317', theme: 'condition-ideal' },
    { activity: 'sup', name: 'St Heliers Bay', url: '/location/st-heliers-bay/-36.8508,174.8593', theme: 'condition-marginal' },
    { activity: 'snorkelling', name: 'Goat Island', url: '/location/goat-island/-36.2675,174.7936', theme: 'condition-acceptable' },
    { activity: 'cycling', name: 'Piha Beach', url: '/location/piha-beach/-36.9553,174.4681', theme: 'condition-unsuitable' },
  ].forEach(({ activity, name, url, theme }) => {
    test(`LDP-07: AI analysis background tint changes with condition level for ${name}`, async ({ page, context }) => {
      // Given the browser viewport is 375px
      await page.setViewportSize({ width: 375, height: 812 });

      // And the browser cookie "selectedActivity" is set to "<activity>" in context
      await context.addCookies([
        { name: 'selectedActivity', value: activity, domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "<url>" page
      await page.goto(`http://localhost:3000${url}`);

      // Then the AI analysis card should have a subtle tint of the "<theme>" colour as background
      const hasTint = await page.getByTestId('location-detail-analysis').getByTestId('analysis-card').evaluate(
        (el, t) => el.style.backgroundColor.includes(`--${t}`),
        theme,
      );
      expect(hasTint).toBe(true);
    });
  });

  [
    { breakpoint: 'tablet', width: 768, columnCount: 2 },
    { breakpoint: 'large tablet', width: 1024, columnCount: 3 },
    { breakpoint: 'desktop', width: 1280, columnCount: 3 },
  ].forEach(({ breakpoint, width, columnCount }) => {
    test(`LDP-09: Location detail page displays correctly at ${breakpoint} viewport`, async ({ page, context }) => {
      // Given the browser viewport is <width>
      await page.setViewportSize({ width, height: 1024 });

      // And the browser cookie "selectedActivity" is set to "sup" in context
      await context.addCookies([
        { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
      ]);

      // When I navigate to the "/location/takapuna-beach/-36.7878,174.7768" page
      await page.goto('http://localhost:3000/location/takapuna-beach/-36.7878,174.7768');

      // Then a share icon button should be visible in the top app bar
      await expect(page.locator('[data-testid="top-appbar-share"]:visible')).toBeVisible();

      // And the score circle should be visible with score "62"
      await expect(page.getByTestId('score-circle')).toBeVisible();
      await expect(page.getByTestId('score-circle')).toContainText('62');

      // And the "Conditions" heading should be visible
      await expect(page.getByTestId('conditions-section').getByRole('heading', { name: 'Conditions' })).toBeVisible();

      // And the factor cards should be displayed in a <columnCount>-column grid layout
      const gridColumns = await page.getByTestId('conditions-section').evaluate((section) => {
        const heading = section.querySelector('h2');
        const gridContainer = heading.nextElementSibling;
        const style = window.getComputedStyle(gridContainer);
        return style.gridTemplateColumns.split(' ').length;
      });
      expect(gridColumns).toBe(columnCount);

      // And the forecast strip should be visible
      await expect(page.getByTestId('location-detail').getByRole('heading', { name: 'Forecast' })).toBeVisible();
    });
  });

  test('LDP-08: Forecast strip displays hourly scores with condition colours', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "sup" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    await page.goto('http://localhost:3000/location/mission-bay/-36.8547,174.8317');

    // Then the heading "Forecast" should be visible
    await expect(page.getByTestId('location-detail').getByRole('heading', { name: 'Forecast' })).toBeVisible();

    // And a horizontally scrollable forecast strip should be visible
    const forecastStrip = page.getByTestId('location-detail').locator('.overflow-x-auto');
    await expect(forecastStrip).toBeVisible();
    const isScrollable = await forecastStrip.evaluate((el) => el.scrollWidth > el.clientWidth);
    expect(isScrollable).toBe(true);

    // And the forecast strip should display 9 time slots
    const allSlots = page.getByTestId('location-detail').locator('[data-testid="forecast-slot"], [data-testid="forecast-slot-best"]');
    await expect(allSlots).toHaveCount(9);

    // And each time slot should show an hour label, score number, and condition bar
    const allHaveChildren = await page.evaluate(() => {
      const slots = [...document.querySelectorAll('[data-testid="forecast-slot"], [data-testid="forecast-slot-best"]')];
      return slots.every((s) =>
        s.querySelector('[data-testid="slot-time"]')
        && s.querySelector('[data-testid="slot-score"]')
        && s.querySelector('[data-testid="slot-bar"]'),
      );
    });
    expect(allHaveChildren).toBe(true);

    // And the "06:00" time slot should display score "72" with an acceptable colour
    const slot0600 = page.locator('[data-testid="forecast-slot"]').filter({ hasText: '06:00' });
    await expect(slot0600.getByTestId('slot-score')).toHaveText('72');
    const slot0600HasAcceptable = await slot0600.getByTestId('slot-bar').evaluate(
      (el) => el.classList.contains('bg-condition-acceptable'),
    );
    expect(slot0600HasAcceptable).toBe(true);

    // And the "09:00" time slot should display score "90" with an ideal colour
    const slot0900 = page.locator('[data-testid="forecast-slot-best"]');
    await expect(slot0900.getByTestId('slot-score')).toHaveText('90');
    const slot0900HasIdeal = await slot0900.getByTestId('slot-bar').evaluate(
      (el) => el.classList.contains('bg-condition-ideal'),
    );
    expect(slot0900HasIdeal).toBe(true);

    // And the "12:00" time slot should display score "76" with a acceptable colour
    const slot1200 = page.locator('[data-testid="forecast-slot"]').filter({ hasText: '12:00' });
    await expect(slot1200.getByTestId('slot-score')).toHaveText('76');
    const slot1200HasAcceptable = await slot1200.getByTestId('slot-bar').evaluate(
      (el) => el.classList.contains('bg-condition-acceptable'),
    );
    expect(slot1200HasAcceptable).toBe(true);

    // And the "09:00" time slot should have a star badge indicating it is the best hour
    await expect(slot0900.getByTestId('best-badge')).toBeVisible();

    // And no other time slot should have a star badge
    const otherBadges = page.locator('[data-testid="forecast-slot"]').locator('[data-testid="best-badge"]');
    await expect(otherBadges).toHaveCount(0);

    // And I should be able to scroll to see the "14:00" time slot
    const slot1400 = page.locator('[data-testid="forecast-slot"]').filter({ hasText: '14:00' });
    const isInitiallyHidden = await slot1400.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const container = el.closest('.overflow-x-auto');
      const containerRect = container.getBoundingClientRect();
      return rect.right > containerRect.right;
    });
    expect(isInitiallyHidden).toBe(true);

    await slot1400.scrollIntoViewIfNeeded();
    const isNowVisible = await slot1400.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const container = el.closest('.overflow-x-auto');
      const containerRect = container.getBoundingClientRect();
      return rect.left >= containerRect.left && rect.right <= containerRect.right;
    });
    expect(isNowVisible).toBe(true);
  });

  test('LDP-10: Back button is keyboard accessible', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookies are cleared in context
    await context.clearCookies();

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');
    await page.waitForLoadState('networkidle');

    // And I tap the "Mission Bay" location card
    await page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ }).click();

    // Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    await expect(page).toHaveURL(/\/location\/mission-bay\/-36\.8547,174\.8317/);

    // When I use Tab to navigate to the back button
    const backButton = page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const isFocused = await backButton.evaluate((el) => document.activeElement === el);
      if (isFocused) break;
    }

    // Then the back button should receive focus
    await expect(backButton).toBeFocused();

    // When I press Enter on the focused back button
    await page.keyboard.press('Enter');

    // Then the browser should navigate to the "/auckland/home" page
    await expect(page).toHaveURL(/\/auckland\/home/);
  });

  test('LDP-11: Share icon in app bar is keyboard accessible', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookie "selectedActivity" is set to "sup" in context
    await context.addCookies([
      { name: 'selectedActivity', value: 'sup', domain: 'localhost', path: '/' },
    ]);

    // When I navigate to the "/location/mission-bay/-36.8547,174.8317" page
    await page.goto('http://localhost:3000/location/mission-bay/-36.8547,174.8317');

    // Mock navigator.share before tabbing to the share button
    await page.evaluate(() => {
      window.__shareCalledWith = null;
      navigator.share = (data) => {
        window.__shareCalledWith = data;
        return Promise.resolve();
      };
    });

    // And I use Tab to navigate to the share icon in the top app bar
    const shareButton = page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-share');
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab');
      const isFocused = await shareButton.evaluate((el) => document.activeElement === el);
      if (isFocused) break;
    }

    // Then the share icon button should receive focus
    await expect(shareButton).toBeFocused();

    // When I press Enter on the focused share icon button
    await page.keyboard.press('Enter');

    // Then the share action should be triggered
    const shareData = await page.evaluate(() => window.__shareCalledWith);
    expect(shareData).toBeTruthy();
    expect(shareData.title).toContain('Mission Bay');
    expect(shareData.url).toContain('/location/mission-bay/-36.8547,174.8317');
  });

  test('LDP-12: Navigating between activities and locations preserves state', async ({ page, context }) => {
    // Given the browser viewport is 375px
    await page.setViewportSize({ width: 375, height: 812 });

    // And the browser cookies are cleared in context
    await context.clearCookies();

    // When I navigate to the "/auckland/home" page
    await page.goto('http://localhost:3000/auckland/home');
    await page.waitForLoadState('networkidle');

    // Then the "SUP" activity pill should be selected
    const supSelected = await page.getByTestId('activity-sup').evaluate((el) => el.classList.contains('bg-primary'));
    expect(supSelected).toBe(true);

    // And the "Mission Bay" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ })).toBeVisible();

    // And the "Takapuna Beach" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Takapuna Beach/ })).toBeVisible();

    // Navigate to Mission Bay detail and back
    // When I tap the "Mission Bay" location card
    await page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ }).click();

    // Then I should be on the "/location/mission-bay/-36.8547,174.8317" page
    await expect(page).toHaveURL(/\/location\/mission-bay\/-36\.8547,174\.8317/);

    // And the top appbar should display the page title "Mission Bay"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('Mission Bay');

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the "SUP" activity pill should be selected
    const supStillSelected = await page.getByTestId('activity-sup').evaluate((el) => el.classList.contains('bg-primary'));
    expect(supStillSelected).toBe(true);

    // And the "Mission Bay" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ })).toBeVisible();

    // And the "Takapuna Beach" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Takapuna Beach/ })).toBeVisible();

    // Switch to Snorkelling and navigate to Goat Island
    // When I tap the "Snorkelling" activity pill
    await page.getByTestId('activity-snorkelling').click();

    // Then the "Snorkelling" activity pill should be selected
    const snorkellingSelected = await page.getByTestId('activity-snorkelling').evaluate((el) => el.classList.contains('bg-primary'));
    expect(snorkellingSelected).toBe(true);

    // And the "Goat Island" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Goat Island/ })).toBeVisible();

    // And the "Mission Bay" location card should not be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ })).toBeHidden();

    // When I tap the "Goat Island" location card
    await page.getByTestId('location-list').getByRole('link', { name: /Goat Island/ }).click();

    // Then I should be on the "/location/goat-island/-36.2675,174.7936" page
    await expect(page).toHaveURL(/\/location\/goat-island\/-36\.2675,174\.7936/);

    // And the top appbar should display the page title "Goat Island"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('Goat Island');

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the "Snorkelling" activity pill should be selected
    const snorkellingStillSelected = await page.getByTestId('activity-snorkelling').evaluate((el) => el.classList.contains('bg-primary'));
    expect(snorkellingStillSelected).toBe(true);

    // And the "Goat Island" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Goat Island/ })).toBeVisible();

    // Switch to Cycling and navigate to Piha Beach
    // When I tap the "Cycling" activity pill
    await page.getByTestId('activity-cycling').click();

    // Then the "Cycling" activity pill should be selected
    const cyclingSelected = await page.getByTestId('activity-cycling').evaluate((el) => el.classList.contains('bg-primary'));
    expect(cyclingSelected).toBe(true);

    // And the "Piha Beach" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Piha Beach/ })).toBeVisible();

    // And the "Goat Island" location card should not be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Goat Island/ })).toBeHidden();

    // When I tap the "Piha Beach" location card
    await page.getByTestId('location-list').getByRole('link', { name: /Piha Beach/ }).click();

    // Then I should be on the "/location/piha-beach/-36.9553,174.4681" page
    await expect(page).toHaveURL(/\/location\/piha-beach\/-36\.9553,174\.4681/);

    // And the top appbar should display the page title "Piha Beach"
    await expect(page.getByTestId('top-appbar-mobile-sub')).toContainText('Piha Beach');

    // When I tap the back button in the top appbar
    await page.getByTestId('top-appbar-mobile-sub').getByTestId('top-appbar-back').click();

    // Then the browser URL should be "/auckland/home"
    await expect(page).toHaveURL(/\/auckland\/home/);

    // And the "Cycling" activity pill should be selected
    const cyclingStillSelected = await page.getByTestId('activity-cycling').evaluate((el) => el.classList.contains('bg-primary'));
    expect(cyclingStillSelected).toBe(true);

    // And the "Piha Beach" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Piha Beach/ })).toBeVisible();

    // Switch back to SUP and verify original locations reappear
    // When I tap the "SUP" activity pill
    await page.getByTestId('activity-sup').click();

    // Then the "SUP" activity pill should be selected
    const supFinalSelected = await page.getByTestId('activity-sup').evaluate((el) => el.classList.contains('bg-primary'));
    expect(supFinalSelected).toBe(true);

    // And the "Mission Bay" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Mission Bay/ })).toBeVisible();

    // And the "Takapuna Beach" location card should be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Takapuna Beach/ })).toBeVisible();

    // And the "Piha Beach" location card should not be visible
    await expect(page.getByTestId('location-list').getByRole('link', { name: /Piha Beach/ })).toBeHidden();
  });
});
