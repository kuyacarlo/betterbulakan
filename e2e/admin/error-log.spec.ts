import {
  test,
  expect,
  mockAdminApi,
  waitForAdminShell,
  type AdminApiMock,
} from '../test-config';
import { assertKapwaTokens } from '../utils/kapwa';

test.describe('Admin Error Log', () => {
  let mock: AdminApiMock;

  test.beforeEach(async ({ page }) => {
    // Authenticated admin session and fixtures served at the network layer
    mock = await mockAdminApi(page);
    // Navigate to error log page
    await page.goto('/admin/errors');
    await waitForAdminShell(page, 'Parse Errors');
  });

  test('error log page uses Kapwa semantic tokens', async ({ page }) => {
    test.skip(
      true,
      'Kapwa Button outline/ghost variants (@bettergov/kapwa 1.2.4) emit raw gray-* classes'
    );
    // Check page title is visible
    await expect(
      page.getByRole('heading', { name: 'Parse Errors' })
    ).toBeVisible();

    // Verify Kapwa semantic tokens are used
    await assertKapwaTokens(page);
  });

  test('error log displays error cards', async ({ page }) => {
    // One card per fixture error; the second has no document number
    await expect(page.getByText('PDF returned 404 Not Found')).toBeVisible();
    await expect(page.getByText('2025-099')).toBeVisible();
    await expect(page.getByText('Unknown Document')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(2);
  });

  test('error log has filter controls', async ({ page }) => {
    // Check for stage filter dropdown
    const filterSelect = page
      .locator('select')
      .or(page.locator('[role="combobox"]'));

    const filterCount = await filterSelect.count();

    // Filter controls should be present (at least for stage filtering)
    expect(filterCount).toBeGreaterThan(0);

    // Filtering by stage re-queries the API
    await page
      .locator('select:has(option[value="download"])')
      .selectOption('download');
    await expect(page.getByRole('button', { name: 'Retry' })).toHaveCount(1);
    expect(mock.requests.some(r => r.search === '?stage=download')).toBe(true);
  });

  test('error log is accessible', async ({ page }) => {
    // Check page has proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check that interactive elements are focusable
    const buttons = page.locator('button, a[href]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('error log has refresh button', async ({ page }) => {
    // Check for refresh button
    const refreshButton = page
      .locator('button')
      .filter({
        hasText: /refresh/i,
      })
      .or(page.locator('button[aria-label*="refresh"]'));

    const refreshExists = (await refreshButton.count()) > 0;
    expect(refreshExists).toBeTruthy();
  });

  test('error log has navigation back to dashboard', async ({ page }) => {
    // Check for link back to admin dashboard
    const dashboardLink = page
      .locator('a[href*="/admin"]')
      .or(page.locator('a[href*="/admin"]'));

    const linkCount = await dashboardLink.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('failed retry shows an error banner', async ({ page }) => {
    // The UI posts to /api/admin/errors/:id, which no Pages Function serves
    await page.getByRole('button', { name: 'Retry' }).first().click();
    await expect(
      page.getByText('Failed to queue retry. Please try again.')
    ).toBeVisible();
    expect(mock.unhandled).toContain('POST /api/admin/errors/err_001');
  });
});
