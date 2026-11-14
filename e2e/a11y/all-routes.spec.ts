import { test as base, type Page } from '@playwright/test';

import { mockApis, shouldMockApis } from '../test-config';
import { expectNoA11yViolations } from '../utils/a11y';
import { remainingRoutes } from './routes';

// One context and page per worker, reused for every route that worker scans
const test = base.extend<object, { sharedPage: Page }>({
  sharedPage: [
    async ({ browser }, use, workerInfo) => {
      const { baseURL, viewport, userAgent, deviceScaleFactor } =
        workerInfo.project.use;
      const context = await browser.newContext({
        baseURL,
        viewport,
        userAgent,
        deviceScaleFactor,
      });
      if (shouldMockApis) await mockApis(context);
      await use(await context.newPage());
      await context.close();
    },
    { scope: 'worker' },
  ],
});

test.describe('Accessibility - all public routes', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const { path, title } of remainingRoutes) {
    test(`${title} (${path}) has no axe violations @a11y`, async ({
      sharedPage,
    }) => {
      await sharedPage.goto(path);
      await expectNoA11yViolations(sharedPage);
    });
  }
});
