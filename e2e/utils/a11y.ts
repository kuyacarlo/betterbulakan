import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

import { waitForRoute } from '../test-config';

/**
 * Run axe-core (WCAG 2.x A/AA plus best practices) against the current page
 * and fail with a readable rule/target summary when anything is flagged.
 */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  await waitForRoute(page);

  const results = await new AxeBuilder({ page }).analyze();

  const summary = results.violations.map(
    v =>
      `${v.id} (${v.impact}): ${v.nodes.length} node(s) - ${v.nodes
        .slice(0, 5)
        .map(n => n.target.join(' '))
        .join(', ')}`
  );
  expect(summary, `axe violations on ${page.url()}`).toEqual([]);
}
