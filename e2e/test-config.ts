/**
 * Global test configuration for E2E tests with API mocking
 *
 * Import from this file instead of @playwright/test to get automatic API mocking:
 *
 *   import { test, expect } from './test-config';
 *
 * When CI is set (e.g. CI=true or CI=1) or MOCK_API=true, all API requests will be mocked automatically.
 */

/* eslint-disable react-hooks/rules-of-hooks -- 'use' is from Playwright fixtures, not React */

import { test as base, expect, type Page } from '@playwright/test';

// Check if API mocking should be enabled
const shouldMockApis = !!process.env.CI || process.env.MOCK_API === 'true';

/**
 * Wait until the app shell has rendered a route instead of the lazy-load fallback.
 */
export async function waitForRoute(page: Page): Promise<void> {
  await page
    .waitForFunction(
      () => {
        const main = document.querySelector('main#main-content');
        return (
          !!main &&
          main.children.length > 0 &&
          !main.textContent?.includes('Loading\u2026')
        );
      },
      undefined,
      { timeout: 15_000 }
    )
    .catch(() => {});
}

/**
 * Extended test object with automatic API mocking
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    if (shouldMockApis) {
      // Set up API routes BEFORE page is used (most specific first)

      await page.route('**/api/weather**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            los_ba_os: {
              name: 'Los Baños',
              coordinates: { lat: 14.1763, lon: 121.2219 },
              weather: [{ icon: '01d', description: 'partly cloudy' }],
              main: {
                temp: 28,
                feels_like: 30,
                temp_min: 25,
                temp_max: 31,
                pressure: 1012,
                humidity: 75,
              },
              visibility: 10000,
              wind: { speed: 3.5, deg: 180 },
              clouds: { all: 10 },
              dt: Math.floor(Date.now() / 1000),
              sys: {},
              timezone: 28800,
              id: 1706511,
              timestamp: new Date().toISOString(),
              hourly: [],
            },
          }),
        });
      });

      await page.route('**/api/openlgu/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], offline: true }),
        });
      });

      await page.route('**/api/admin/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ authenticated: false, offline: true }),
        });
      });

      await page.route('**/api/weather**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            los_ba_os: {
              name: 'Los Baños',
              temperature: 28,
              description: 'partly cloudy',
            },
          }),
        });
      });

      await page.route('**/api/submit-contribution**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, offline: true }),
        });
      });

      // External forex ticker; keeps CI off third-party network calls
      await page.route('https://api.bettergov.ph/forex**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({
            rates: [{ country: 'USD', symbol: 'USD', phpEquivalent: 58 }],
          }),
        });
      });

      // Catch-all for all other API requests (must be LAST)
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: null, offline: true }),
        });
      });
    }

    // Routes are lazy-loaded; wait for the Suspense fallback to clear after each goto
    const goto = page.goto.bind(page);
    page.goto = async (url, options) => {
      const response = await goto(url, options);
      await waitForRoute(page);
      return response;
    };

    await use(page);
  },
});

// Re-export expect for convenience
export { expect };
