import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const metrics = [
  ['jsRoutes', 'jsMetric', 'client-reference-assigned-uncompressed-js-bytes', 'jsBytes', 'jsBytes'],
  ['cssRoutes', 'cssMetric', 'client-reference-assigned-uncompressed-css-bytes', 'cssBytes', 'cssBytes'],
  ['jsRoutesGzip', 'jsGzipMetric', 'client-reference-assigned-gzip-js-bytes', 'jsBytes', 'jsGzipBytes'],
  ['cssRoutesGzip', 'cssGzipMetric', 'client-reference-assigned-gzip-css-bytes', 'cssBytes', 'cssGzipBytes'],
];
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const safeBytes = value => Number.isSafeInteger(value) && value >= 0;
const safePath = value => typeof value === 'string' && value.startsWith('/') && !value.includes('//') && !/[?#\\\s\u0000-\u001f\u007f]/u.test(value) && !value.split('/').some(segment => segment === '.' || segment === '..');
const safeRoute = value => {
  if (!safePath(value) || /%25/i.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    return safePath(decoded) && decoded.split('/').length === value.split('/').length;
  } catch { return false; }
};

function normalize(report) {
  if (!record(report) || report.metric !== 'unattributed-uncompressed-build-assets' || report.routeAttributionAvailable !== false || report.jsRouteAttributionAvailable !== true || report.cssRouteAttributionAvailable !== true) {
    throw new Error('Incomplete Next.js client-reference attribution');
  }
  const entries = new Map();
  for (const [list, metric, expected, sourceBytes, outputBytes] of metrics) {
    if (report[metric] !== expected) throw new Error('Unsupported route measurement metric');
    const rows = report[list];
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Incomplete route measurement list');
    const seen = new Set();
    for (const row of rows) {
      if (!record(row) || !safePath(row.appPath) || !/^\/[A-Za-z0-9_()[\].@/-]*page$/u.test(row.appPath) || !row.appPath.endsWith('/page') || !safeRoute(row.route) || !safeBytes(row[sourceBytes])) {
        throw new Error('Invalid route measurement');
      }
      if (seen.has(row.appPath)) throw new Error('Duplicate App Router entry');
      seen.add(row.appPath);
      if (list === 'jsRoutes') entries.set(row.appPath, { appPath: row.appPath, route: row.route });
      const entry = entries.get(row.appPath);
      if (!entry || entry.route !== row.route) throw new Error('Incomplete or inconsistent route identity');
      entry[outputBytes] = row[sourceBytes];
    }
    if (seen.size !== entries.size) throw new Error('Incomplete route measurement list');
  }
  const routes = report.routes;
  const measured = new Set([...entries.values()].map(entry => entry.route));
  if (!Array.isArray(routes) || routes.some(route => !safeRoute(route)) || new Set(routes).size !== routes.length || report.routeCount !== routes.length || routes.length !== measured.size || routes.some(route => !measured.has(route))) {
    throw new Error('Incomplete reported public route inventory');
  }
  return entries;
}

/** Compare saved Next.js 16 build reports; never sum route bytes or infer transfer. */
export function compareRouteBundles(baseline, candidate) {
  const before = normalize(baseline);
  const after = normalize(candidate);
  const added = [], removed = [], changed = [];
  let unchanged = 0;
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  for (const appPath of keys) {
    const old = before.get(appPath), next = after.get(appPath);
    if (!old) { added.push({ appPath, route: next.route }); continue; }
    if (!next) { removed.push({ appPath, route: old.route }); continue; }
    if (old.route !== next.route) throw new Error('Invalid changed public label for identical App Router entry');
    const delta = { appPath, route: next.route };
    for (const [, , , , key] of metrics) delta[key] = next[key] - old[key];
    if (metrics.some(([, , , , key]) => delta[key] !== 0)) changed.push(delta);
    else unchanged += 1;
  }
  return {
    metric: 'client-reference-assigned-byte-deltas',
    routeSetUnchanged: added.length === 0 && removed.length === 0,
    compared: unchanged + changed.length,
    unchanged, added, removed, changed,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: node scripts/compare-route-bundles.mjs baseline.json candidate.json');
    const [baseline, candidate] = process.argv.slice(2).map(path => JSON.parse(readFileSync(path, 'utf8')));
    process.stdout.write(JSON.stringify(compareRouteBundles(baseline, candidate), null, 2) + '\n');
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : String(error)) + '\n');
    process.exitCode = 1;
  }
}
