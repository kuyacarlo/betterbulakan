import { UserRole } from '../../functions/utils/rbac';
import { test, expect, mockAdminApi, waitForAdminShell } from '../test-config';
import { assertKapwaTokens } from '../utils/kapwa';

test.describe('Admin Review Queue Page', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticated admin session and fixtures served at the network layer
    await mockAdminApi(page);
    // Navigate to admin review queue page
    await page.goto('/admin/review-queue');
    await waitForAdminShell(page, 'Review Queue');
  });

  test('review queue page uses Kapwa semantic tokens', async ({ page }) => {
    test.skip(
      true,
      'Kapwa Button outline/ghost variants (@bettergov/kapwa 1.2.4) emit raw gray-* classes'
    );
    // Check page title is visible
    await expect(
      page.getByRole('heading', { name: 'Review Queue' })
    ).toBeVisible();

    await assertKapwaTokens(page);
  });

  test('review queue page shows empty state when no items', async ({
    page,
  }) => {
    await page.route(
      url => url.pathname === '/api/admin/review-queue',
      route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: [],
            pagination: { total: 0, limit: 20, offset: 0, has_more: false },
          }),
        })
    );
    await page.reload();
    await waitForAdminShell(page);

    await expect(
      page.getByRole('heading', { name: 'No items in review queue' })
    ).toBeVisible();
    await expect(
      page.getByText('No items with status "pending"')
    ).toBeVisible();
  });

  test('review queue page is accessible', async ({ page }) => {
    // Check page has proper heading structure
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    // Check that interactive elements are focusable
    const buttons = page.locator('button, a[href]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('lists pending items by default', async ({ page }) => {
    await expect(page.getByText('2 items needing review')).toBeVisible();
    await expect(page.getByText('missing_author')).toBeVisible();
    await expect(page.getByText('attendance_mismatch')).toBeVisible();
    await expect(page.getByText('low_ocr_confidence')).toHaveCount(0);
  });

  test('approving an in-progress item removes it from the list', async ({
    page,
  }) => {
    await page
      .locator('select:has(option[value="in_progress"])')
      .selectOption('in_progress');
    await expect(page.getByText('low_ocr_confidence')).toBeVisible();

    await page.getByRole('button', { name: 'Approve', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'No items in review queue' })
    ).toBeVisible();
  });

  test('status update failure shows an error banner', async ({ page }) => {
    await page.route('**/api/admin/review-queue/status', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to update status' }),
      })
    );

    await page
      .getByRole('button', { name: 'Skip', exact: true })
      .first()
      .click();
    await expect(
      page.getByText('Failed to update status: Failed to update status')
    ).toBeVisible();
    // Item stays in the pending list
    await expect(page.getByText('2 items needing review')).toBeVisible();
  });
});

test.describe('Admin Review Queue as an editor', () => {
  test('start review assigns the item to the editor', async ({ page }) => {
    const mock = await mockAdminApi(page, { role: UserRole.EDITOR });
    await page.goto('/admin/review-queue');
    await waitForAdminShell(page, 'Review Queue');

    await page.getByRole('button', { name: 'Start Review' }).first().click();

    // Item leaves the pending list once both mutations land
    await expect(page.getByText('1 items needing review')).toBeVisible();
    expect(
      mock.requests.filter(r => r.method === 'POST').map(r => r.body)
    ).toEqual(
      expect.arrayContaining([
        { item_id: 'rq_001', status: 'in_progress' },
        { item_id: 'rq_001' },
      ])
    );

    await page
      .locator('select:has(option[value="in_progress"])')
      .selectOption('in_progress');
    // Only rq_001 can carry the editor's login (rq_003 belongs to e2e-admin)
    await expect(page.getByText('missing_author')).toBeVisible();
    await expect(page.getByText('Assigned to e2e-editor')).toBeVisible();
  });

  test('mutations send a CSRF token the API accepts', async ({ page }) => {
    test.fail(
      true,
      'App bug: admin UI never fetches /api/admin/auth/csrf or sends X-CSRF-Token'
    );
    await mockAdminApi(page, { role: UserRole.EDITOR, enforceCsrf: true });
    await page.goto('/admin/review-queue');
    await waitForAdminShell(page, 'Review Queue');

    await page
      .getByRole('button', { name: 'Skip', exact: true })
      .first()
      .click();
    await expect(page.getByText('1 items needing review')).toBeVisible({
      timeout: 3_000,
    });
  });
});
