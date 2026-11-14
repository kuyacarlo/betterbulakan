import { UserRole } from '../../functions/utils/rbac';
import { test, expect, mockAdminApi, waitForAdminShell } from '../test-config';
import { assertKapwaTokens } from '../utils/kapwa';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticated admin session and fixtures served at the network layer
    await mockAdminApi(page);
    await page.goto('/admin');
    await waitForAdminShell(page);
  });

  test('admin dashboard uses Kapwa semantic tokens', async ({ page }) => {
    test.skip(
      true,
      'Kapwa Button outline/ghost variants (@bettergov/kapwa 1.2.4) emit raw gray-* classes'
    );
    await assertKapwaTokens(page);
  });

  test('admin dashboard displays stat cards', async ({ page }) => {
    // Values are derived from the fixtures: 2 errors, 2 pending, 2 conflicts, 3 docs
    for (const [title, value] of [
      ['Failed Parses', '2'],
      ['Review Queue', '2'],
      ['Reconcile', '2'],
      ['Documents', '3'],
    ]) {
      const card = page.locator('a').filter({
        has: page.getByRole('heading', { level: 3, name: title, exact: true }),
      });
      await expect(card).toBeVisible();
      await expect(card).toContainText(value);
    }
    await expect(page.getByText('4 total items awaiting review')).toBeVisible();
  });

  test('admin dashboard has navigation links', async ({ page }) => {
    const documentsLink = page.locator('a[href*="/admin/documents"]');
    const reviewQueueLink = page.locator('a[href*="/admin/review-queue"]');
    const errorsLink = page.locator('a[href*="/admin/errors"]');
    const reconcileLink = page.locator('a[href*="/admin/reconcile"]');

    const linkCount =
      (await documentsLink.count()) +
      (await reviewQueueLink.count()) +
      (await errorsLink.count()) +
      (await reconcileLink.count());

    expect(linkCount).toBeGreaterThan(0);

    // Stat card links route inside the SPA
    await documentsLink.first().click();
    await expect(page).toHaveURL(/\/admin\/documents$/);
    await expect(
      page.getByRole('heading', { name: 'Documents Management' })
    ).toBeVisible();
  });

  test('admin dashboard is accessible', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const buttons = page.locator('button, a[href]');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('shows the signed-in GitHub user', async ({ page }) => {
    await expect(page.getByText('E2E Admin')).toBeVisible();
    await expect(page.getByText('admin@example.test')).toBeVisible();
  });

  test('recent activity lists resolved review items', async ({ page }) => {
    await expect(page.getByText('missing date')).toBeVisible();
    await expect(page.getByText('Resolved by e2e-admin')).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Ordinance 2025-101/ })
    ).toBeVisible();
  });

  test('logout returns to the sign-in screen', async ({ page }) => {
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(
      page.getByRole('heading', { name: 'Admin Access Required' })
    ).toBeVisible();
  });

  test('stats failure leaves placeholder values', async ({ page }) => {
    await page.route('**/api/admin/stats', route =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to fetch stats' }),
      })
    );
    await page.reload();
    await waitForAdminShell(page);

    const reviewCard = page
      .locator('a')
      .filter({ has: page.getByRole('heading', { name: 'Review Queue' }) });
    await expect(reviewCard).toContainText('--');
  });
});

test.describe('Admin access without a session', () => {
  test.beforeEach(async ({ page }) => {
    await mockAdminApi(page, { role: 'anonymous' });
    await page.goto('/admin');
    await waitForAdminShell(page);
  });

  test('shows the GitHub sign-in gate', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'Admin Access Required' })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toHaveCount(
      0
    );
  });

  test('sign in redirects to GitHub OAuth', async ({ page }) => {
    await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
    await expect(page).toHaveURL(/\/api\/admin\/auth\/login$/);
    await expect(page).toHaveTitle('GitHub OAuth (mocked)');
  });
});

test.describe('Admin access as an editor', () => {
  test('editors get the dashboard too', async ({ page }) => {
    const mock = await mockAdminApi(page, { role: UserRole.EDITOR });
    await page.goto('/admin');
    await waitForAdminShell(page);

    await expect(page.getByText('E2E Editor')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    expect(mock.unhandled).toEqual([]);
  });
});
