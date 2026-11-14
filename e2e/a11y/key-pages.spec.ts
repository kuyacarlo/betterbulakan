import { test } from '../test-config';
import { expectNoA11yViolations } from '../utils/a11y';

// Key public pages that must stay free of axe violations (run by the CI a11y job)
const pages: [name: string, path: string][] = [
  ['Home', '/'],
  ['Elected officials', '/government/elected-officials'],
  ['Departments index', '/government/departments'],
  [
    'Department detail',
    '/government/departments/business-permit-and-licensing-office',
  ],
  ['Barangays index', '/government/barangays'],
  ['Barangay detail', '/government/barangays/barangay-bagumbayan'],
  ['Services index', '/services'],
  ['Service detail', '/services/browse-municipal-ordinances'],
  ['Statistics', '/statistics'],
  ['Transparency', '/transparency'],
];

test.describe('Accessibility - key pages', () => {
  for (const [name, path] of pages) {
    test(`${name} has no axe violations @a11y`, async ({ page }) => {
      await page.goto(path);
      await expectNoA11yViolations(page);
    });
  }
});
