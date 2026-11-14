/**
 * Single source of public, indexable routes for sitemap.xml and llms.txt.
 * Mirrors the route table in src/App.tsx: static pages, feature-gated
 * sections (config.features), and detail pages derived from data slugs.
 * Admin, search, redirects and dev-only pages are intentionally excluded.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../..'
);
const readJson = rel =>
  JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));

export const config = readJson('config/lgu.config.json');
export const baseUrl = config.portal.baseUrl.replace(/\/+$/, '');
export const absolute = route => `${baseUrl}${route === '/' ? '/' : route}`;

// Data backing the detail routes (same files the pages import)
export const data = {
  services: readJson('src/data/citizens-charter/merged-services.json'),
  departments: readJson('src/data/directory/departments.json'),
  barangays: readJson('src/data/directory/barangays.json'),
  executive: readJson('src/data/directory/executive.json'),
  legislative: readJson('src/data/directory/legislative.json'),
};

/** Route groups in display order; each route is { path, title }. */
export function getRouteGroups() {
  const { features } = config;
  const groups = [
    {
      name: 'Main',
      routes: [
        { path: '/', title: 'Home' },
        { path: '/about', title: 'About' },
        { path: '/contact', title: 'Contact' },
        { path: '/accessibility', title: 'Accessibility' },
        { path: '/ideas', title: 'Ideas' },
        { path: '/join-us', title: 'Join Us' },
        { path: '/contribute', title: 'Contribute' },
        { path: '/terms-of-service', title: 'Terms of Service' },
        { path: '/sitemap', title: 'Sitemap' },
        { path: '/data/weather', title: 'Weather' },
        { path: '/data/forex', title: 'Forex Rates' },
      ],
    },
    {
      name: 'Government',
      routes: [
        { path: '/government/elected-officials', title: 'Elected Officials' },
        {
          path: '/government/elected-officials/committees',
          title: 'Standing Committees',
        },
        { path: '/government/departments', title: 'Departments' },
        ...data.departments.map(d => ({
          path: `/government/departments/${d.slug}`,
          title: d.office_name,
        })),
        { path: '/government/barangays', title: 'Barangays' },
        ...data.barangays.map(b => ({
          path: `/government/barangays/${b.slug}`,
          title: `Barangay ${b.barangay_name}`,
        })),
      ],
    },
    {
      name: 'Services',
      routes: [
        { path: '/services', title: 'All Services' },
        ...data.services.map(s => ({
          path: `/services/${s.slug}`,
          title: s.service,
        })),
      ],
    },
  ];

  if (features.statistics) {
    groups.push({
      name: 'Statistics',
      routes: [
        { path: '/statistics', title: 'Statistics' },
        { path: '/statistics/population', title: 'Population' },
        { path: '/statistics/municipal-income', title: 'Municipal Income' },
        { path: '/statistics/competitiveness', title: 'Competitiveness' },
      ],
    });
  }
  if (features.transparency) {
    groups.push({
      name: 'Transparency',
      routes: [
        { path: '/transparency', title: 'Transparency Portal' },
        { path: '/transparency/financial', title: 'Financial Reports' },
        { path: '/transparency/procurement', title: 'Procurement' },
        { path: '/transparency/infrastructure', title: 'Infrastructure' },
      ],
    });
  }
  if (features.openLGU) {
    groups.push({
      name: 'OpenLGU',
      routes: [
        { path: '/openlgu', title: 'Legislation' },
        { path: '/openlgu/officials', title: 'Officials' },
        { path: '/openlgu/terms', title: 'Terms' },
      ],
    });
  }
  return groups;
}

export const getAllRoutes = () => getRouteGroups().flatMap(g => g.routes);

export function writePublicFile(name, contents) {
  const target = path.join(root, 'public', name);
  fs.writeFileSync(target, contents);
  return target;
}
