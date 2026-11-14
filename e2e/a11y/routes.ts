import { getAllRoutes } from '../../scripts/lib/site-routes.js';

// Key public pages that must stay free of axe violations (run by the CI a11y job)
export const keyPages: [name: string, path: string][] = [
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

// Every other public route from the sitemap source, so new routes are scanned automatically
const keyPaths = new Set(keyPages.map(([, path]) => path));
export const remainingRoutes: { path: string; title: string }[] =
  getAllRoutes().filter((route: { path: string }) => !keyPaths.has(route.path));
