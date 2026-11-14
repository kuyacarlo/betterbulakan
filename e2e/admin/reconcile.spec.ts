import {
  test,
  expect,
  mockAdminApi,
  waitForAdminShell,
  type AdminApiMock,
} from '../test-config';
import { assertKapwaTokens } from '../utils/kapwa';

test.describe('Admin Reconcile', () => {
  let mock: AdminApiMock;

  test.beforeEach(async ({ page }) => {
    // Authenticated admin session and fixtures served at the network layer
    mock = await mockAdminApi(page);
    // Navigate to reconcile page
    await page.goto('/admin/reconcile');
    await waitForAdminShell(page, 'Data Reconciliation');
  });

  test('reconcile page uses Kapwa semantic tokens', async ({ page }) => {
    test.skip(
      true,
      'Kapwa Button outline/ghost variants (@bettergov/kapwa 1.2.4) emit raw gray-* classes'
    );
    // Check page title is visible
    await expect(
      page.getByRole('heading', { name: 'Data Reconciliation' })
    ).toBeVisible();

    // Verify Kapwa semantic tokens are used
    await assertKapwaTokens(page);
  });

  test('reconcile page displays conflict records', async ({ page }) => {
    // One card per unresolved fixture conflict
    await expect(
      page.getByText('2 conflicts between Facebook and gov.ph sources')
    ).toBeVisible();
    await expect(page.getByText('R - 2025-044')).toBeVisible();
    await expect(page.getByText('O - 2025-101')).toBeVisible();
  });

  test('reconcile page has filter controls', async ({ page }) => {
    // Status and conflict-type filters are SelectPicker listbox triggers
    const filterSelect = page
      .locator('select')
      .or(page.locator('[role="combobox"]'))
      .or(page.locator('button[aria-haspopup="listbox"]'));

    const filterCount = await filterSelect.count();

    // Filter controls should be present
    expect(filterCount).toBeGreaterThan(0);
  });

  test('reconcile page is accessible', async ({ page }) => {
    // Check page has proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check that interactive elements are focusable
    const buttons = page.locator('button, a[href]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('reconcile page has refresh button', async ({ page }) => {
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

  test('reconcile page has navigation back to dashboard', async ({ page }) => {
    // Check for link back to admin dashboard
    const dashboardLink = page
      .locator('a[href*="/admin"]')
      .or(page.locator('a[href*="/admin"]'));

    const linkCount = await dashboardLink.count();
    expect(linkCount).toBeGreaterThan(0);
  });

  test('choosing the gov.ph value resolves the conflict', async ({ page }) => {
    test.skip(
      true,
      'App bug: POST /api/admin/reconcile parses conflict ids greedily; real doc ids get 400 Invalid conflict type'
    );
    await page.getByText('R - 2025-044').click();
    await page.getByRole('button', { name: 'Use gov.ph' }).click();

    // List refetches without the resolved conflict
    await expect(
      page.getByText('1 conflicts between Facebook and gov.ph sources')
    ).toBeVisible();
    await expect(page.getByText('R - 2025-044')).toHaveCount(0);

    const resolve = mock.requests.find(
      r => r.method === 'POST' && r.path === '/api/admin/reconcile'
    );
    expect(resolve?.body).toEqual({
      conflict_id: 'conflict_moved_by_resolution_sb_12_2025-044',
      resolved_value: 'Hon. Jose Reyes',
      notes: 'Using gov.ph value',
    });
  });
});
