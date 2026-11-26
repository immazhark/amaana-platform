import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const root = new URL('../', import.meta.url);
function config(acceptance) {
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', 'import c from "./next.config.ts"; console.log(JSON.stringify(c.images))'], { cwd: root, env: {...process.env, AMAANA_BROWSER_ACCEPTANCE: String(acceptance)}, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
const staticPatterns = [
  { pathname: '/brand/**', search: '' },
  { pathname: '/hero/**', search: '' },
  { pathname: '/programme-artwork/**', search: '' },
  { pathname: '/media/*', search: '' },
];
test('production optimizer is limited to static namespaces; no year/key or arbitrary route', () => {
  const images = config(false);
  assert.deepEqual(images.localPatterns, staticPatterns);
  assert.equal(images.minimumCacheTTL, 60);
});
test('browser acceptance adds only the two nonrevocable fixture query variants', () => {
  assert.deepEqual(config(true).localPatterns, [...staticPatterns,
    { pathname: '/browser-acceptance/image-cache-source', search: '?policy=bounded' },
    { pathname: '/browser-acceptance/image-cache-source', search: '?policy=immutable' },
  ]);
});
test('managed media route keeps publication and approval gates and no-store success policy', () => {
  const source = readFileSync(new URL('src/app/media/[year]/[filename]/route.ts', root), 'utf8');
  assert.match(source, /isPublic:\s*true/);
  assert.match(source, /privacyApprovedAt:\s*\{\s*not:\s*null\s*\}/);
  assert.match(source, /const headers = new Headers\(\{\s*"Cache-Control": "private, no-store, max-age=0"/);
  assert.doesNotMatch(source, /"Cache-Control":\s*"public,/);
});

function rewrites(acceptance) {
  const r = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', 'import c from "./next.config.ts"; console.log(JSON.stringify(await c.rewrites?.() ?? []))'], { cwd: root, env: {...process.env, AMAANA_BROWSER_ACCEPTANCE: String(acceptance)}, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}
test('production has no synthetic media rewrite', () => assert.deepEqual(rewrites(false), []));
test('acceptance no longer depends on rewritten query parameters', () => assert.deepEqual(rewrites(true), []));
import './test-materialize-managed-image-acceptance.mjs';
