import { test } from '../test-config';
import { expectNoA11yViolations } from '../utils/a11y';
import { keyPages } from './routes';

test.describe('Accessibility - key pages', () => {
  for (const [name, path] of keyPages) {
    test(`${name} has no axe violations @a11y`, async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  }
});
