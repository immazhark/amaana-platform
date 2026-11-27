import test from 'node:test';
import assert from 'node:assert/strict';
import * as comparator from './compare-route-bundles.mjs';

const row = (appPath, route, jsBytes, cssBytes) => ({ appPath, route, jsBytes, cssBytes });
function report(rows) {
  return {
    metric: 'unattributed-uncompressed-build-assets', routeAttributionAvailable: false,
    routes: [...new Set(rows.map(item => item.route))].sort(), routeCount: new Set(rows.map(item => item.route)).size,
    jsRouteAttributionAvailable: true, cssRouteAttributionAvailable: true,
    jsMetric: 'client-reference-assigned-uncompressed-js-bytes',
    cssMetric: 'client-reference-assigned-uncompressed-css-bytes',
    jsGzipMetric: 'client-reference-assigned-gzip-js-bytes',
    cssGzipMetric: 'client-reference-assigned-gzip-css-bytes',
    jsRoutes: rows.map(({ appPath, route, jsBytes }) => ({ appPath, route, jsBytes })),
    cssRoutes: rows.map(({ appPath, route, cssBytes }) => ({ appPath, route, cssBytes })),
    jsRoutesGzip: rows.map(({ appPath, route, jsBytes }) => ({ appPath, route, jsBytes: Math.ceil(jsBytes / 2) })),
    cssRoutesGzip: rows.map(({ appPath, route, cssBytes }) => ({ appPath, route, cssBytes: Math.ceil(cssBytes / 2) })),
  };
}
const a = row('/page', '/', 100, 200);
const b = row('/(site)/impact/page', '/impact', 400, 600);
const compare = (before, after) => comparator.compareRouteBundles(before, after);

test('reports exact per-route raw and gzip deltas and deterministic ordering', () => {
  const result = compare(report([b, a]), report([a, { ...b, jsBytes: 450, cssBytes: 580 }]));
  assert.equal(result.routeSetUnchanged, true);
  assert.deepEqual(result.changed, [{ appPath: b.appPath, route: b.route, jsBytes: 50, cssBytes: -20, jsGzipBytes: 25, cssGzipBytes: -10 }]);
  assert.equal(result.unchanged, 1);
  assert.equal(result.compared, 2);
});
test('does not compare added or removed routes as zero-byte improvements', () => {
  const c = row('/give/page', '/give', 10, 20);
  const result = compare(report([a, b]), report([c, a]));
  assert.equal(result.routeSetUnchanged, false);
  assert.deepEqual(result.added, [{ appPath: c.appPath, route: c.route }]);
  assert.deepEqual(result.removed, [{ appPath: b.appPath, route: b.route }]);
  assert.deepEqual(result.changed, []);
});
test('rejects unavailable, incompatible or incomplete attribution', () => {
  const valid = report([a]);
  for (const bad of [null, { ...valid, jsRouteAttributionAvailable: false }, { ...valid, jsGzipMetric: 'transfer' }, { ...valid, cssRoutesGzip: [] }, { ...valid, jsRoutes: undefined }]) {
    assert.throws(() => compare(valid, bad), /Invalid|Incomplete|Unsupported/);
  }
});
test('rejects duplicate identities, inconsistent route labels and invalid byte measurements', () => {
  const valid = report([a]);
  for (const bad of [report([a, a]), { ...valid, cssRoutes: [{ ...valid.cssRoutes[0], route: '/other' }] }, { ...valid, jsRoutes: [{ ...valid.jsRoutes[0], jsBytes: -1 }] }, { ...valid, cssRoutes: [{ ...valid.cssRoutes[0], cssBytes: 1.5 }] }, report([row('/../page', '/bad', 1, 1)])]) {
    assert.throws(() => compare(valid, bad), /Invalid|Incomplete|Duplicate/);
  }
});
test('keeps distinct App Router entries with the same public label separate', () => {
  const c = row('/(alternate)/impact/page', '/impact', 50, 70);
  const result = compare(report([b, c]), report([b, { ...c, cssBytes: 90 }]));
  assert.equal(result.compared, 2);
  assert.equal(result.changed[0].appPath, c.appPath);
  assert.equal(result.changed[0].cssBytes, 20);
});
test('CLI emits JSON only on success and fails closed on missing attribution', async () => {
  const { mkdtempSync, writeFileSync, rmSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const dir = mkdtempSync(join(tmpdir(), 'amaana-route-compare-'));
  try {
    const before = join(dir, 'before.json'), after = join(dir, 'after.json');
    writeFileSync(before, JSON.stringify(report([a])));
    writeFileSync(after, JSON.stringify(report([{ ...a, jsBytes: 120 }])));
    const cli = fileURLToPath(new URL('./compare-route-bundles.mjs', import.meta.url));
    const run = () => spawnSync(process.execPath, [cli, before, after], { encoding: 'utf8', timeout: 5000 });
    const good = run();
    assert.equal(good.status, 0, good.stderr);
    assert.equal(JSON.parse(good.stdout).changed[0].jsBytes, 20);
    writeFileSync(after, JSON.stringify({ jsRouteAttributionAvailable: false }));
    const bad = run();
    assert.equal(bad.status, 1);
    assert.equal(bad.stdout, '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rejects a whole route omitted from every measurement list', () => {
  const incomplete = { ...report([a]), routes: ['/', '/impact'], routeCount: 2 };
  assert.throws(() => compare(report([a, b]), incomplete), /Incomplete/);
});
