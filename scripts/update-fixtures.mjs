#!/usr/bin/env node
// Regenerate test/fixtures/ from the current dist/ build. Run via
// `npm run test:update` after intentionally changing the route set
// (adding a composer or work), then review the fixture diff — it IS the
// list of URL changes you are shipping.
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { routes_in } from '../test/routes.mjs'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const dist = path.join(root, 'dist');
const fixtures = path.join(root, 'test', 'fixtures');

const routes = routes_in(dist);

const xml = readFileSync(path.join(dist, 'sitemap', 'sitemap-0.xml'), 'utf8');
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]).sort();

writeFileSync(path.join(fixtures, 'routes.json'), JSON.stringify(routes, null, 2) + '\n');
writeFileSync(path.join(fixtures, 'sitemap-urls.json'), JSON.stringify(urls, null, 2) + '\n');
console.log(`fixtures updated: ${routes.length} routes, ${urls.length} sitemap urls`);
