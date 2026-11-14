#!/usr/bin/env node

/**
 * Script to generate llms.txt file for AI crawler guidance
 * (https://llmstxt.org). Content comes from config/lgu.config.json and the
 * same data files the site renders, so it stays in sync with the portal.
 */
import {
  absolute,
  config,
  data,
  getRouteGroups,
  writePublicFile,
} from './lib/site-routes.js';

const { lgu, portal } = config;
const link = (title, route) => `- [${title}](${absolute(route)})`;

// Header and summary
const lines = [
  `# ${portal.name}`,
  '',
  `> ${portal.description}`,
  '',
  `${portal.name} is a volunteer-run, open-source portal for the ${lgu.fullName}, ${lgu.province} (${lgu.region}). It is not an official government website; the official LGU site is ${lgu.officialWebsite}.`,
  '',
  `Source code: ${portal.githubUrl}`,
  '',
];

// Officials, from the same directory data the site shows
const executive = data.executive.filter(o => o.isElected !== false);
const council = data.legislative.flatMap(c => c.officials ?? []);
if (executive.length || council.length) {
  lines.push('## Elected Officials', '');
  executive.forEach(o => lines.push(`- ${o.role}: ${o.name}`));
  council.forEach(o => lines.push(`- ${o.role}: ${o.name}`));
  lines.push('');
}

// One section per route group
for (const group of getRouteGroups()) {
  lines.push(`## ${group.name}`, '');
  group.routes.forEach(r => lines.push(link(r.title, r.path)));
  lines.push('');
}

const target = writePublicFile('llms.txt', lines.join('\n'));
console.log(`✓ llms.txt → ${target}`);
