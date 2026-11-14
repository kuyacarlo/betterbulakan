#!/usr/bin/env node

/**
 * Generate public/sitemap.xml from the shared route list.
 * Deterministic output (no lastmod) so regenerating doesn't churn git.
 */
import { absolute, getAllRoutes, writePublicFile } from './lib/site-routes.js';

const escapeXml = s =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const urls = getAllRoutes()
  .map(r => `  <url>\n    <loc>${escapeXml(absolute(r.path))}</loc>\n  </url>`)
  .join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const target = writePublicFile('sitemap.xml', xml);
console.log(`✓ sitemap.xml: ${getAllRoutes().length} URLs → ${target}`);
