import { test, expect } from './test-config';

test.describe('Sitemap Page', () => {
  test('every sitemap link resolves to a routed page', async ({ page }) => {
    // Visits every public route in sequence, which can outrun the default 30s under parallel load
    test.slow();
    await page.goto('/sitemap');

    const hrefs = await page
      .locator('main a[href^="/"]')
      .evaluateAll(links =>
        links.map(link => link.getAttribute('href') as string)
      );
    expect(hrefs.length).toBeGreaterThan(10);

    // The catch-all route renders a "404" h1; no sitemap entry should land there
    for (const href of new Set(hrefs)) {
      await page.goto(href);
      await expect(
        page.locator('main h1', { hasText: /^404$/ }),
        `${href} should not 404`
      ).toHaveCount(0);
    }
  });
});
