import {
  test,
  expect,
  mockAdminApi,
  waitForAdminShell,
  type AdminApiMock,
} from '../test-config';
import { assertKapwaTokens } from '../utils/kapwa';

test.describe('Admin Documents Page', () => {
  let mock: AdminApiMock;

  test.beforeEach(async ({ page }) => {
    // Authenticated admin session and fixtures served at the network layer
    mock = await mockAdminApi(page);
    // Navigate to admin documents page
    await page.goto('/admin/documents');
    await waitForAdminShell(page, 'Documents Management');
  });

  test('documents page uses Kapwa semantic tokens', async ({ page }) => {
    test.skip(
      true,
      'Kapwa Button outline/ghost variants (@bettergov/kapwa 1.2.4) emit raw gray-* classes'
    );
    // Check page title is visible
    await expect(
      page.getByRole('heading', { name: 'Documents Management' })
    ).toBeVisible();

    await assertKapwaTokens(page);
  });

  test('documents page displays document table or cards', async ({ page }) => {
    // Check for document table with one row per fixture document
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(3);
    await expect(page.getByText('3 total documents')).toBeVisible();
    await expect(
      page.getByText('An Ordinance Regulating Riverside Fish Pens')
    ).toBeVisible();
  });

  test('type filter queries the API and narrows the table', async ({
    page,
  }) => {
    await page
      .locator('select:has(option[value="ordinance"])')
      .selectOption('ordinance');

    await expect(page.locator('table tbody tr')).toHaveCount(1);
    expect(
      mock.requests.some(
        r =>
          r.path === '/api/admin/documents' &&
          r.search.includes('type=ordinance')
      )
    ).toBe(true);
  });

  test('shows the empty state when nothing matches', async ({ page }) => {
    await page
      .locator('select:has(option[value="suspended"])')
      .selectOption('suspended');
    await expect(
      page.getByRole('heading', { name: 'No documents found' })
    ).toBeVisible();
  });
});
