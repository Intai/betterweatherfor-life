import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';

// ============================================================
// Helper Functions
// ============================================================

const BASE_URL = 'http://localhost:3000';

// ============================================================
// Test Suite
// ============================================================

test.describe('Feature: App Folder Structure', () => {
  test('AFS-01: Landing page is accessible and server-side rendered', async ({ page }) => {
    // When I navigate to "/"
    const response = await page.goto(`${BASE_URL}/`);

    // Then the page should return status code 200
    expect(response.status()).toBe(200);

    // And the page title should be "Find Your Perfect Outdoor Day | Better Weather For Life"
    await expect(page).toHaveTitle(
      'Find Your Perfect Outdoor Day | Better Weather For Life',
    );

    // And the page should contain a "description" meta tag with "Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions."
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions.',
    );

    // And the page should contain an "og:title" meta tag with "Find Your Perfect Outdoor Day"
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Find Your Perfect Outdoor Day',
    );

    // And the page should contain an "og:description" meta tag with "Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions."
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      'content',
      'Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions.',
    );

    // And the page title and description should be present in the raw server response
    const html = execSync(`curl -s ${BASE_URL}/`, { encoding: 'utf-8' });
    expect(html).toContain('<title>Find Your Perfect Outdoor Day | Better Weather For Life</title>');
    expect(html).toContain(
      'Find the best places for SUP, kayaking, snorkeling, and cycling based on real-time weather, tide, and sea conditions.',
    );
  });

  test('AFS-02: About page is accessible and server-side rendered', async ({ page }) => {
    // When I navigate to "/about"
    const response = await page.goto(`${BASE_URL}/about`);

    // Then the page should return status code 200
    expect(response.status()).toBe(200);

    // And the page title should be "About Us | Better Weather For Life"
    await expect(page).toHaveTitle(
      'About Us | Better Weather For Life',
    );

    // And the page should contain a "description" meta tag with "Learn how Better Weather For Life helps outdoor enthusiasts find the perfect conditions for their activities."
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Learn how Better Weather For Life helps outdoor enthusiasts find the perfect conditions for their activities.',
    );

    // And the page title and description should be present in the raw server response
    const html = execSync(`curl -s ${BASE_URL}/about`, { encoding: 'utf-8' });
    expect(html).toContain('<title>About Us | Better Weather For Life</title>');
    expect(html).toContain(
      'Learn how Better Weather For Life helps outdoor enthusiasts find the perfect conditions for their activities.',
    );
  });

  test('AFS-03: Privacy page is accessible and server-side rendered', async ({ page }) => {
    // When I navigate to "/privacy"
    const response = await page.goto(`${BASE_URL}/privacy`);

    // Then the page should return status code 200
    expect(response.status()).toBe(200);

    // And the page title should be "Privacy Policy | Better Weather For Life"
    await expect(page).toHaveTitle(
      'Privacy Policy | Better Weather For Life',
    );

    // And the page should contain a "description" meta tag with "How Better Weather For Life collects, uses, and protects your personal information."
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'How Better Weather For Life collects, uses, and protects your personal information.',
    );

    // And the page title and description should be present in the raw server response
    const html = execSync(`curl -s ${BASE_URL}/privacy`, { encoding: 'utf-8' });
    expect(html).toContain('<title>Privacy Policy | Better Weather For Life</title>');
    expect(html).toContain(
      'How Better Weather For Life collects, uses, and protects your personal information.',
    );
  });

  [
    {
      city: 'auckland',
      title: 'Auckland - Best Outdoor Spots | Better Weather For Life',
      ogTitle: 'Auckland - Best Outdoor Spots',
      description: 'Find the best spots for SUP, kayaking, snorkeling, and cycling in Auckland based on current weather and sea conditions.',
    },
    {
      city: 'wellington',
      title: 'Wellington - Best Outdoor Spots | Better Weather For Life',
      ogTitle: 'Wellington - Best Outdoor Spots',
      description: 'Find the best spots for SUP, kayaking, snorkeling, and cycling in Wellington based on current weather and sea conditions.',
    },
    {
      city: 'christchurch',
      title: 'Christchurch - Best Outdoor Spots | Better Weather For Life',
      ogTitle: 'Christchurch - Best Outdoor Spots',
      description: 'Find the best spots for SUP, kayaking, snorkeling, and cycling in Christchurch based on current weather and sea conditions.',
    },
  ].forEach(({ city, title, ogTitle, description }) => {
    test(`AFS-04: City home page is accessible and server-side rendered (${city})`, async ({ page }) => {
      // When I navigate to "/<city>/home"
      const response = await page.goto(`${BASE_URL}/${city}/home`);

      // Then the page should return status code 200
      expect(response.status()).toBe(200);

      // And the page title should be "<title>"
      await expect(page).toHaveTitle(title);

      // And the page should contain a "description" meta tag with "<description>"
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        description,
      );

      // And the page should contain an "og:title" meta tag with "<ogTitle>"
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        ogTitle,
      );

      // And the page should contain an "og:description" meta tag with "<description>"
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description,
      );

      // And the page title and description should be present in the raw server response
      const html = execSync(`curl -s ${BASE_URL}/${city}/home`, { encoding: 'utf-8' });
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(description);
    });
  });

  [
    {
      city: 'auckland',
      title: 'Auckland 7-Day Forecast | Better Weather For Life',
      ogTitle: 'Auckland 7-Day Forecast',
      description: '7-day weather, tide, and sea conditions forecast for outdoor activities in Auckland.',
    },
    {
      city: 'wellington',
      title: 'Wellington 7-Day Forecast | Better Weather For Life',
      ogTitle: 'Wellington 7-Day Forecast',
      description: '7-day weather, tide, and sea conditions forecast for outdoor activities in Wellington.',
    },
    {
      city: 'new-plymouth',
      title: 'New Plymouth 7-Day Forecast | Better Weather For Life',
      ogTitle: 'New Plymouth 7-Day Forecast',
      description: '7-day weather, tide, and sea conditions forecast for outdoor activities in New Plymouth.',
    },
  ].forEach(({ city, title, ogTitle, description }) => {
    test(`AFS-05: City forecast page is accessible and server-side rendered (${city})`, async ({ page }) => {
      // When I navigate to "/<city>/forecast"
      const response = await page.goto(`${BASE_URL}/${city}/forecast`);

      // Then the page should return status code 200
      expect(response.status()).toBe(200);

      // And the page title should be "<title>"
      await expect(page).toHaveTitle(title);

      // And the page should contain a "description" meta tag with "<description>"
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        description,
      );

      // And the page should contain an "og:title" meta tag with "<ogTitle>"
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        ogTitle,
      );

      // And the page title and description should be present in the raw server response
      const html = execSync(`curl -s ${BASE_URL}/${city}/forecast`, { encoding: 'utf-8' });
      expect(html).toContain(`<title>${title}</title>`);
      expect(html).toContain(description);
    });
  });

  [
    {
      name: 'mission-bay',
      geolocation: '-36.8547,174.8317',
      title: 'Mission Bay - Weather & Conditions | Better Weather For Life',
      ogTitle: 'Mission Bay - Weather & Conditions',
      description: 'View detailed weather, tide, and sea conditions for Mission Bay. Find the best time for SUP, kayaking, snorkeling, and cycling.',
    },
    {
      name: 'takapuna-beach',
      geolocation: '-36.7878,174.7768',
      title: 'Takapuna Beach - Weather & Conditions | Better Weather For Life',
      ogTitle: 'Takapuna Beach - Weather & Conditions',
      description: 'View detailed weather, tide, and sea conditions for Takapuna Beach. Find the best time for SUP, kayaking, snorkeling, and cycling.',
    },
  ].forEach(({ name, geolocation, title, ogTitle, description }) => {
    test(`AFS-06: Location detail page is accessible and server-side rendered (${name})`, async ({ page }) => {
      // When I navigate to "/location/<name>/<geolocation>"
      const response = await page.goto(`${BASE_URL}/location/${name}/${geolocation}`);

      // Then the page should return status code 200
      expect(response.status()).toBe(200);

      // And the page title should be "<title>"
      await expect(page).toHaveTitle(title);

      // And the page should contain a "description" meta tag with "<description>"
      await expect(page.locator('meta[name="description"]')).toHaveAttribute(
        'content',
        description,
      );

      // And the page should contain an "og:title" meta tag with "<ogTitle>"
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        ogTitle,
      );

      // And the page should contain an "og:description" meta tag with "<description>"
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
        'content',
        description,
      );

      // And the page title and description should be present in the raw server response
      const html = execSync(`curl -s ${BASE_URL}/location/${name}/${geolocation}`, { encoding: 'utf-8' });
      expect(html).toContain(`<title>${title.replace(/&/g, '&amp;')}</title>`);
      expect(html).toContain(description);
    });
  });

  [
    { route: '/home' },
    { route: '/forecast' },
  ].forEach(({ route }) => {
    test(`AFS-07: App pages are accessible and client-side rendered (${route})`, async ({ page }) => {
      // When I navigate to "<route>"
      const response = await page.goto(`${BASE_URL}${route}`);

      // Then the page should return status code 200
      expect(response.status()).toBe(200);

      // And the page title should be "Better Weather For Life" in the raw server response
      const html = execSync(`curl -s "${BASE_URL}${route}"`, { encoding: 'utf-8' });
      expect(html).toContain('<title>Better Weather For Life</title>');
    });
  });

  test('AFS-08: robots.txt is accessible', async () => {
    // When I request "/robots.txt"
    const response = await fetch(`${BASE_URL}/robots.txt`);

    // Then the response should return status code 200
    expect(response.status).toBe(200);

    // And the response content type should be "text/plain"
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('text/plain');

    // And the robots.txt should reference the sitemap at "/sitemap.xml"
    const body = await response.text();
    expect(body).toMatch(/Sitemap:.*\/sitemap\.xml/);
  });

  test('AFS-09: robots.txt allows crawling of marketing routes', async () => {
    // When I request "/robots.txt"
    const response = await fetch(`${BASE_URL}/robots.txt`);
    const body = await response.text();

    // Parse Disallow directives from robots.txt
    const disallowedPaths = body
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.replace('Disallow:', '').trim());

    // Then the robots.txt should allow crawling of "/"
    expect(disallowedPaths).not.toContain('/');

    // And the robots.txt should allow crawling of "/about"
    expect(disallowedPaths.some((path) => '/about'.startsWith(path))).toBe(false);

    // And the robots.txt should allow crawling of "/privacy"
    expect(disallowedPaths.some((path) => '/privacy'.startsWith(path))).toBe(false);

    // And the robots.txt should allow crawling of "/auckland/home"
    expect(disallowedPaths.some((path) => '/auckland/home'.startsWith(path))).toBe(false);

    // And the robots.txt should allow crawling of "/auckland/forecast"
    expect(disallowedPaths.some((path) => '/auckland/forecast'.startsWith(path))).toBe(false);

    // And the robots.txt should allow crawling of "/auckland/location/"
    expect(disallowedPaths.some((path) => '/auckland/location/'.startsWith(path))).toBe(false);
  });

  test('AFS-10: robots.txt blocks crawling of app routes', async () => {
    // When I request "/robots.txt"
    const response = await fetch(`${BASE_URL}/robots.txt`);
    const body = await response.text();

    // Parse Disallow directives from robots.txt
    const disallowedPaths = body
      .split('\n')
      .filter((line) => line.startsWith('Disallow:'))
      .map((line) => line.replace('Disallow:', '').trim());

    // Then the robots.txt should disallow crawling of "/home"
    expect(disallowedPaths).toContain('/home');

    // And the robots.txt should disallow crawling of "/forecast"
    expect(disallowedPaths).toContain('/forecast');

    // And the robots.txt should disallow crawling of "/location/"
    expect(disallowedPaths).toContain('/location/');
  });

  test('AFS-11: sitemap.xml is accessible', async () => {
    // When I request "/sitemap.xml"
    const response = await fetch(`${BASE_URL}/sitemap.xml`);

    // Then the response should return status code 200
    expect(response.status).toBe(200);

    // And the response content type should be "application/xml"
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/xml');

    // And the sitemap should use the sitemap protocol namespace
    const body = await response.text();
    expect(body).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');

    // And each URL entry should include a "loc" element
    const urlEntries = body.match(/<url>[\s\S]*?<\/url>/g) || [];
    expect(urlEntries.length).toBeGreaterThan(0);
    for (const entry of urlEntries) {
      expect(entry).toMatch(/<loc>.*<\/loc>/);
    }

    // And each URL entry should include a "lastmod" element
    for (const entry of urlEntries) {
      expect(entry).toMatch(/<lastmod>.*<\/lastmod>/);
    }
  });

  test('AFS-12: sitemap.xml contains marketing routes', async () => {
    // When I request "/sitemap.xml"
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    const body = await response.text();

    // Extract all <loc> URLs from the sitemap
    const locUrls = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    // Then the sitemap should contain the URL "/"
    expect(locUrls.some((url) => url.endsWith('/')
      || url === 'https://betterweatherfor.life')).toBe(true);

    // And the sitemap should contain the URL "/about"
    expect(locUrls.some((url) => url.endsWith('/about'))).toBe(true);

    // And the sitemap should contain the URL "/privacy"
    expect(locUrls.some((url) => url.endsWith('/privacy'))).toBe(true);

    // And the sitemap should contain the URL "/auckland/home"
    expect(locUrls.some((url) => url.endsWith('/auckland/home'))).toBe(true);

    // And the sitemap should contain the URL "/auckland/forecase"
    expect(locUrls.some((url) => url.endsWith('/auckland/forecase'))).toBe(true);
  });

  test('AFS-13: sitemap.xml does not contain app routes', async () => {
    // When I request "/sitemap.xml"
    const response = await fetch(`${BASE_URL}/sitemap.xml`);
    const body = await response.text();

    // Extract all <loc> URLs from the sitemap
    const locUrls = [...body.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);

    // Extract URL paths from the full URLs
    const urlPaths = locUrls.map((url) => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    });

    // Then the sitemap should not contain the URL "/home"
    expect(urlPaths).not.toContain('/home');

    // And the sitemap should not contain the URL "/forecast"
    expect(urlPaths).not.toContain('/forecast');

    // And the sitemap should not contain the URL pattern "/location/"
    // Bare app routes like "/location/..." should not be present
    // City-prefixed routes like "/auckland/location/..." are allowed
    const bareLocationUrls = urlPaths.filter((path) => path.startsWith('/location/'));
    expect(bareLocationUrls).toHaveLength(0);
  });

  test('AFS-14: manifest.webmanifest contains required PWA fields', async () => {
    // When I request "/manifest.webmanifest"
    const response = await fetch(`${BASE_URL}/manifest.webmanifest`);

    // Then the response should return status code 200
    expect(response.status).toBe(200);

    // And the response content type should be "application/manifest+json"
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('application/manifest+json');

    // Parse the manifest JSON
    const manifest = await response.json();

    // And the manifest should contain a "name" field
    expect(manifest.name).toBeDefined();

    // And the manifest should contain a "short_name" field
    expect(manifest.short_name).toBeDefined();

    // And the manifest should contain a "description" field
    expect(manifest.description).toBeDefined();

    // And the manifest should contain a "start_url" field
    expect(manifest.start_url).toBeDefined();

    // And the manifest should contain a "display" field with value "standalone"
    expect(manifest.display).toBe('standalone');

    // And the manifest should contain a "background_color" field
    expect(manifest.background_color).toBeDefined();

    // And the manifest should contain a "theme_color" field
    expect(manifest.theme_color).toBeDefined();

    // And the manifest should contain an "icons" array
    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThan(0);

    // And each icon should have a valid "src" path, a "type" field, and a "sizes" field
    for (const icon of manifest.icons) {
      expect(icon.src).toBeDefined();
      expect(typeof icon.src).toBe('string');
      expect(icon.src.length).toBeGreaterThan(0);
      expect(icon.type).toBeDefined();
      expect(icon.sizes).toBeDefined();
    }
  });

  test('AFS-15: OpenGraph image is accessible', async () => {
    // When I request "/opengraph-image.png"
    const response = await fetch(`${BASE_URL}/opengraph-image.png`);

    // Then the response should return status code 200
    expect(response.status).toBe(200);

    // And the response content type should be "image/png"
    const contentType = response.headers.get('content-type');
    expect(contentType).toContain('image/png');
  });

  test('AFS-16: Marketing pages reference OpenGraph image', async ({ page }) => {
    // When I navigate to "/"
    await page.goto(`${BASE_URL}/`);

    // Then the page should contain an "og:image" meta tag
    await expect(page.locator('meta[property="og:image"]')).toBeAttached();

    // And the "og:image" meta tag should reference a valid image URL for "opengraph-image-*.png"
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      /opengraph-image.*\.png/,
    );
  });

  test('AFS-17: Non-existent routes return 404', async ({ page }) => {
    // When I navigate to "/non-existent-page"
    const response = await page.goto(`${BASE_URL}/non-existent-page`);

    // Then the page should return status code 404
    expect(response.status()).toBe(404);

    // And the page should display a user-friendly 404 message
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(page.getByText(/could not be found/i)).toBeVisible();
  });
});
