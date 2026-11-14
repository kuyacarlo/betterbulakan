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

import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from '@playwright/test';

import { Permission, UserRole, hasPermission } from '../functions/utils/rbac';
import * as adminData from './fixtures/admin/data';
import { adminUsers } from './fixtures/admin/data';
import type {
  DashboardStats,
  RecentActivityItem,
  ReviewStatus,
} from './fixtures/admin/types';

// Check if API mocking should be enabled
export const shouldMockApis =
  !!process.env.CI || process.env.MOCK_API === 'true';

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
 * Mock API and third-party requests on a page or a whole browser context
 */
export async function mockApis(target: Page | BrowserContext): Promise<void> {
  // Set up API routes BEFORE page is used (most specific first)

  await target.route('**/api/weather**', route => {
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

  await target.route('**/api/openlgu/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], offline: true }),
    });
  });

  await target.route('**/api/admin/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ authenticated: false, offline: true }),
    });
  });

  await target.route('**/api/weather**', route => {
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

  await target.route('**/api/submit-contribution**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, offline: true }),
    });
  });

  // External forex ticker; keeps CI off third-party network calls
  await target.route('https://api.bettergov.ph/forex**', route => {
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
  await target.route('**/api/**', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: null, offline: true }),
    });
  });
}

export type AdminRole = UserRole | 'anonymous';

export interface MockAdminApiOptions {
  /** Session to stub; defaults to an authenticated admin */
  role?: AdminRole;
  /**
   * Reject mutations without a valid X-CSRF-Token, like withAuth({ requireCSRF }).
   * Off by default: the admin UI never sends the token (see the PR notes).
   */
  enforceCsrf?: boolean;
}

export interface RecordedAdminRequest {
  method: string;
  path: string;
  search: string;
  body: unknown;
  csrfToken: string | null;
}

export interface AdminApiMock {
  requests: RecordedAdminRequest[];
  /** Admin paths the mock had no handler for (a contract drift signal) */
  unhandled: string[];
  store: ReturnType<typeof createAdminStore>;
}

function createAdminStore(role: AdminRole) {
  return {
    role,
    documents: structuredClone(adminData.documents),
    parseErrors: structuredClone(adminData.parseErrors),
    auditLogs: structuredClone(adminData.auditLogs),
    reviewQueue: structuredClone(adminData.reviewQueue),
    conflicts: structuredClone(adminData.conflicts),
    csrfTokens: new Set<string>(),
  };
}

// Mirrors withAuth({ requirePermission }) on the handlers that declare one
const ADMIN_PERMISSIONS: Array<[RegExp, string, Permission]> = [
  [
    /^\/api\/admin\/workbench\/review-decisions$/,
    'POST',
    Permission.WORKBENCH_WRITE,
  ],
  [/^\/api\/admin\/workbench\//, 'GET', Permission.WORKBENCH_READ],
];

// Handlers whose withAuth wrapper sets requireCSRF: true
const CSRF_PATHS = [
  /^\/api\/admin\/errors$/,
  /^\/api\/admin\/reconcile$/,
  /^\/api\/admin\/review-queue\/(status|assign)$/,
  /^\/api\/admin\/documents(\/.*)?$/,
  /^\/api\/admin\/sessions(\/.*)?$/,
  /^\/api\/admin\/attendance(\/.*)?$/,
  /^\/api\/admin\/persons-merge$/,
  /^\/api\/admin\/parse-facebook-post$/,
];

const json = (status: number, body: unknown) => ({
  status,
  contentType: 'application/json',
  body: JSON.stringify(body),
});

function paginate<T>(rows: T[], limit: number, offset: number) {
  return {
    page: rows.slice(offset, offset + limit),
    pagination: {
      total: rows.length,
      limit,
      offset,
      has_more: offset + limit < rows.length,
    },
  };
}

function intParam(params: URLSearchParams, key: string, fallback: number) {
  const value = parseInt(params.get(key) ?? '', 10);
  return Number.isNaN(value) ? fallback : value;
}

/**
 * Mock the admin Pages Functions at the network layer.
 * Session, CSRF, RBAC and list/mutation endpoints follow the real handlers in
 * functions/api/admin/** and serve the fixtures in e2e/fixtures/admin.
 * Register after mockApis() so these routes take precedence.
 */
export async function mockAdminApi(
  page: Page,
  { role = UserRole.ADMIN, enforceCsrf = false }: MockAdminApiOptions = {}
): Promise<AdminApiMock> {
  const store = createAdminStore(role);
  const mock: AdminApiMock = { requests: [], unhandled: [], store };

  // GitHub avatars in the session bar; keep CI off the network
  await page.route('https://avatars.githubusercontent.com/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(TRANSPARENT_PNG, 'base64'),
    })
  );

  // Reconcile reads a document from a path no Pages Function serves
  await page.route('**/api/legislation/**', route =>
    route.fulfill({ status: 404, body: 'Not Found' })
  );

  await page.route('**/api/admin/**', async route => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;
    const params = url.searchParams;
    let body: Record<string, unknown> = {};
    try {
      body = request.postDataJSON() ?? {};
    } catch {
      // Non-JSON or empty body
    }
    mock.requests.push({
      method,
      path,
      search: url.search,
      body,
      csrfToken: request.headers()['x-csrf-token'] ?? null,
    });

    const fulfill = (status: number, payload: unknown) =>
      route.fulfill(json(status, payload));
    const user = store.role === 'anonymous' ? null : adminUsers[store.role];

    // Auth endpoints (functions/api/admin/auth/*)
    if (path === '/api/admin/auth/session') {
      return user
        ? fulfill(200, { authenticated: true, user, role: store.role })
        : fulfill(401, { authenticated: false });
    }
    if (path === '/api/admin/auth/login') {
      // Real handler 302s to github.com/login/oauth/authorize; Playwright does
      // not route redirect hops, so serve a stand-in page instead of leaving CI
      return route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<title>GitHub OAuth (mocked)</title><h1>GitHub OAuth</h1>',
      });
    }
    if (path === '/api/admin/auth/logout' && method === 'POST') {
      store.role = 'anonymous';
      return route.fulfill({
        status: 302,
        headers: { Location: `${url.origin}/admin` },
      });
    }

    // withAuth(): session, RBAC, then CSRF
    if (!user || store.role === 'anonymous') {
      return fulfill(401, {
        error: 'No session cookie found',
        authenticated: false,
      });
    }
    const rule = ADMIN_PERMISSIONS.find(
      ([pattern, m]) => pattern.test(path) && m === method
    );
    if (rule && !hasPermission(store.role, rule[2])) {
      return fulfill(403, { error: 'Insufficient permissions' });
    }
    const isMutation = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (enforceCsrf && isMutation && CSRF_PATHS.some(p => p.test(path))) {
      const token = request.headers()['x-csrf-token'] ?? '';
      if (!store.csrfTokens.delete(token)) {
        return fulfill(403, { error: 'Invalid CSRF token' });
      }
    }

    // Routed handlers
    const route_ = `${method} ${path}`;
    switch (route_) {
      case 'GET /api/admin/auth/csrf': {
        const token = `csrf-${store.csrfTokens.size + 1}-${Date.now()}`;
        store.csrfTokens.add(token);
        return fulfill(200, { csrf_token: token });
      }

      case 'GET /api/admin/stats': {
        const rq = store.reviewQueue;
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const stats: DashboardStats = {
          review_queue: {
            total: rq.length,
            pending: rq.filter(i => i.status === 'pending').length,
            in_progress: rq.filter(i => i.status === 'in_progress').length,
            resolved: rq.filter(i => i.status === 'resolved').length,
          },
          documents: {
            total: store.documents.length,
            pending_review: store.documents.filter(
              d => d.review_status === 'in_review'
            ).length,
            processed: store.documents.filter(
              d => d.review_status === 'approved'
            ).length,
          },
          errors: {
            total: store.parseErrors.length,
            recent: store.parseErrors.filter(
              e => Date.parse(e.timestamp) > weekAgo
            ).length,
          },
          conflicts: {
            active: store.conflicts.filter(c => c.status === 'unresolved')
              .length,
          },
          deletion_queue: { total: adminData.deletionQueueTotal },
        };
        return fulfill(200, stats);
      }

      case 'GET /api/admin/recent-activity': {
        const items: RecentActivityItem[] = store.reviewQueue
          .filter(i => i.status === 'resolved' && i.resolved_at)
          .sort((a, b) =>
            (b.resolved_at ?? '').localeCompare(a.resolved_at ?? '')
          )
          .slice(0, 10)
          .map(i => ({
            id: i.id,
            item_type: i.item_type,
            item_id: i.item_id,
            issue_type: i.issue_type,
            description: i.description,
            resolved_at: i.resolved_at as string,
            assigned_to: i.assigned_to,
            resolution: i.resolution,
            document: i.document && {
              id: i.document.id,
              type: i.document.type,
              number: i.document.number,
              title: i.document.title,
            },
          }));
        return fulfill(200, { items });
      }

      case 'GET /api/admin/documents': {
        const search = params.get('search')?.toLowerCase();
        const rows = store.documents.filter(
          d =>
            (!search ||
              d.number.toLowerCase().includes(search) ||
              d.title.toLowerCase().includes(search)) &&
            (!params.get('status') || d.status === params.get('status')) &&
            (!params.get('type') || d.type === params.get('type')) &&
            (!params.get('review_status') ||
              d.review_status === params.get('review_status'))
        );
        const { page: documents, pagination } = paginate(
          rows,
          intParam(params, 'limit', 50),
          intParam(params, 'offset', 0)
        );
        return fulfill(200, { documents, pagination });
      }

      case 'GET /api/admin/errors': {
        const stage = params.get('stage');
        const errors = store.parseErrors.filter(
          e => !stage || e.stage === stage
        );
        return fulfill(200, { errors, total: errors.length });
      }

      case 'GET /api/admin/audit-logs': {
        const filtered = store.auditLogs.filter(
          l =>
            (!params.get('action') || l.action === params.get('action')) &&
            (!params.get('performed_by') ||
              l.performedBy === params.get('performed_by')) &&
            (!params.get('target_type') ||
              l.targetType === params.get('target_type'))
        );
        const pageNo = Math.max(1, intParam(params, 'page', 1));
        const limit = Math.min(
          100,
          Math.max(10, intParam(params, 'limit', 50))
        );
        return fulfill(200, {
          logs: filtered.slice((pageNo - 1) * limit, pageNo * limit),
          pagination: {
            page: pageNo,
            limit,
            total: filtered.length,
            totalPages: Math.ceil(filtered.length / limit),
          },
        });
      }

      case 'GET /api/admin/review-queue': {
        const rows = store.reviewQueue.filter(
          i =>
            (!params.get('status') || i.status === params.get('status')) &&
            (!params.get('item_type') ||
              i.item_type === params.get('item_type'))
        );
        const { page: items, pagination } = paginate(
          rows,
          intParam(params, 'limit', 20),
          intParam(params, 'offset', 0)
        );
        return fulfill(200, { items, pagination });
      }

      case 'POST /api/admin/review-queue/status': {
        const { item_id, status } = body as {
          item_id?: string;
          status?: ReviewStatus;
        };
        if (!item_id || !status) {
          return fulfill(400, { error: 'Missing required fields' });
        }
        if (
          !['pending', 'in_progress', 'resolved', 'skipped'].includes(status)
        ) {
          return fulfill(400, { error: 'Invalid status' });
        }
        const item = store.reviewQueue.find(i => i.id === item_id);
        if (item) {
          item.status = status;
          if (status === 'resolved')
            item.resolved_at = new Date().toISOString();
        }
        return fulfill(200, { success: true });
      }

      case 'POST /api/admin/review-queue/assign': {
        const { item_id } = body as { item_id?: string };
        if (!item_id) return fulfill(400, { error: 'Missing item_id' });
        const item = store.reviewQueue.find(i => i.id === item_id);
        if (item) {
          item.assigned_to = user.login;
          item.status = 'in_progress';
        }
        return fulfill(200, { success: true });
      }

      case 'GET /api/admin/reconcile': {
        // The handler recomputes open conflicts and ignores ?status=
        const { page: items, pagination } = paginate(
          store.conflicts.filter(c => c.status === 'unresolved'),
          intParam(params, 'limit', 20),
          intParam(params, 'offset', 0)
        );
        return fulfill(200, { items, pagination });
      }

      case 'POST /api/admin/reconcile': {
        const { conflict_id, resolved_value } = body as {
          conflict_id?: string;
          resolved_value?: string;
        };
        if (!conflict_id || resolved_value === undefined) {
          return fulfill(400, { error: 'Missing required fields' });
        }
        // Same greedy parse as the handler, so ids with underscores get a 400
        const type = conflict_id.match(/^conflict_(\w+)_/)?.[1];
        if (type !== 'moved_by' && type !== 'seconded_by') {
          return fulfill(400, { error: 'Invalid conflict type' });
        }
        const conflict = store.conflicts.find(c => c.id === conflict_id);
        if (conflict) {
          conflict.status = 'resolved';
          conflict.resolved_value = resolved_value;
        }
        return fulfill(200, { success: true });
      }
    }

    // No Pages Functions route matches (e.g. /errors/:id, /reconcile/skip)
    mock.unhandled.push(route_);
    return route.fulfill({ status: 404, body: 'Not Found' });
  });

  return mock;
}

/**
 * Wait for AdminAuthProvider to finish the session check and render the shell.
 * Its loading spinner has no text, so waitForRoute() alone returns too early.
 * Pass the page's own heading to also wait until its data has loaded.
 */
export async function waitForAdminShell(
  page: Page,
  pageHeading?: string
): Promise<void> {
  await expect(
    page.getByRole('heading', {
      level: 1,
      name: /Admin Dashboard|Admin Access Required/,
    })
  ).toBeVisible();
  if (pageHeading) {
    await expect(
      page.getByRole('heading', { level: 2, name: pageHeading })
    ).toBeVisible();
  }
}

// 1x1 transparent PNG
const TRANSPARENT_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/**
 * Extended test object with automatic API mocking
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    if (shouldMockApis) {
      await mockApis(page);
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
