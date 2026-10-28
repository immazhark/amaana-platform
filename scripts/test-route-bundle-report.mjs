import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { summarizeAppRouteBundles, summarizeUnattributedAppAssets } from "./report-route-bundles.mjs";
import * as reporter from "./report-route-bundles.mjs";

const referenceSource = (page, entryCSSFiles) =>
  'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\n' +
  'globalThis.__RSC_MANIFEST[' + JSON.stringify(page) + '] = ' + JSON.stringify({ entryCSSFiles }) + ';\n';

test("counts inherited layouts, unique assets and App Router pages", () => {
  const sizes = {
    "static/chunks/shared.js": 100,
    "static/css/site.css": 20,
    "static/chunks/about.js": 30,
    "static/chunks/deep.js": 40,
  };
  const result = summarizeAppRouteBundles({
    "/layout": ["static/chunks/shared.js", "static/css/site.css"],
    "/page": ["static/chunks/shared.js"],
    "/about/page": ["static/chunks/about.js", "static/chunks/shared.js"],
    "/about/layout": ["static/chunks/deep.js"],
    "/about/team/page": ["static/chunks/about.js"],
    "/_not-found/page": [],
  }, asset => {
    assert.ok(Object.hasOwn(sizes, asset), asset);
    return sizes[asset];
  });
  const byRoute = Object.fromEntries(result.map(row => [row.route, row]));
  assert.equal(byRoute["/"].totalBytes, 120);
  assert.equal(byRoute["/about"].totalBytes, 190);
  assert.equal(byRoute["/about/team"].totalBytes, 190);
  assert.equal(byRoute["/about/team"].jsBytes, 170);
  assert.equal(byRoute["/about/team"].cssBytes, 20);
});

test("ignores unsafe paths and rejects malformed or empty manifests", () => {
  assert.throws(() => summarizeAppRouteBundles(null, () => 0), /valid pages map/);
  assert.throws(() => summarizeAppRouteBundles({}, () => 0), /No App Router/);
  const data = summarizeAppRouteBundles({
    "/page": ["../outside.js", "static/../outside.js", "_next/static/chunks/ok.js", "static/media/font.woff2"],
  }, asset => {
    assert.equal(asset, "static/chunks/ok.js");
    return 42;
  });
  assert.equal(data[0].totalBytes, 42);
});

test("legacy route assignments reject missing and invalid measured bytes", () => {
  const pages = { '/page': ['static/chunks/page.js'] };
  for (const bytes of [undefined, null, NaN, Infinity, -1, 1.5]) {
    assert.throws(() => summarizeAppRouteBundles(pages, () => bytes), /Invalid bundle size/);
  }
  assert.deepEqual(summarizeAppRouteBundles(pages, () => 0), [{
    route: '/', entries: 1, jsBytes: 0, cssBytes: 0, totalBytes: 0,
  }]);
  assert.throws(() => summarizeAppRouteBundles({
    '/page': ['static/chunks/huge.js', 'static/css/small.css'],
  }, asset => asset.endsWith('.js') ? Number.MAX_SAFE_INTEGER : 1), /Invalid route total size/);
});

test("Next 16 without an app build manifest reports aggregate-only figures", () => {
  const report = summarizeUnattributedAppAssets({
    "/page": "/", "/about/page": "/about", "/about/layout": "/about",
    "/_not-found/page": "/_not-found", "/about/(nested)/page": "/about",
  }, [
    { path: "chunks/shared.js", bytes: 100 },
    { path: "css/site.css", bytes: 35 },
    { path: "media/icon.svg", bytes: 20 },
  ]);
  assert.equal(report.routeAttributionAvailable, false);
  assert.equal(report.routeCount, 3);
  assert.deepEqual(report.routes, ["/", "/_not-found", "/about"]);
  assert.deepEqual(report.aggregate, { jsBytes: 100, cssBytes: 35, totalBytes: 135, assetCount: 3 });
  assert.equal(typeof report.routes[0], "string");
});

test("Next 16 fallback rejects missing or empty route inventories", () => {
  assert.throws(() => summarizeUnattributedAppAssets(null, []), /path manifest/);
  assert.throws(() => summarizeUnattributedAppAssets({ "/layout": "/" }, []), /No App Router pages/);
});

test("unattributed aggregate rejects unmeasured asset sizes instead of producing NaN", () => {
  const routes = { '/page': '/' };
  for (const bytes of [undefined, null, NaN, Infinity, -1, 1.5]) {
    assert.throws(() => summarizeUnattributedAppAssets(routes, [{ path: 'chunks/a.js', bytes }]), /Invalid aggregate asset size/);
  }
  assert.deepEqual(summarizeUnattributedAppAssets(routes, [
    { path: 'chunks/empty.js', bytes: 0 }, { path: 'css/empty.css', bytes: 0 },
  ]).aggregate, { jsBytes: 0, cssBytes: 0, totalBytes: 0, assetCount: 2 });
  assert.throws(() => summarizeUnattributedAppAssets(routes, [
    { path: 'chunks/huge.js', bytes: Number.MAX_SAFE_INTEGER }, { path: 'css/small.css', bytes: 1 },
  ]), /Invalid aggregate total size/);
});

test("parses the Next 16 JSON assignment without executing JavaScript", () => {
  assert.equal(typeof reporter.parseClientReferenceManifest, "function");
  const source = referenceSource('/about/page', { '[project]/src/app/layout': [] });
  assert.deepEqual(reporter.parseClientReferenceManifest(source, '/about/page'), {
    entryCSSFiles: { '[project]/src/app/layout': [] },
  });
  assert.throws(() => reporter.parseClientReferenceManifest(source, '/page'), /identity/);
  assert.throws(() => reporter.parseClientReferenceManifest(source + 'globalThis.manifestExecuted = true;', '/about/page'));
  assert.equal(globalThis.manifestExecuted, undefined);
  assert.throws(() => reporter.parseClientReferenceManifest('globalThis.manifestExecuted = true;', '/page'));
  assert.throws(() => reporter.parseClientReferenceManifest(referenceSource('/page', []), '/page'), /CSS map/);
});

test("attributes unique CSS to page and inherited layouts while excluding error-only CSS", () => {
  assert.equal(typeof reporter.summarizeClientReferenceCss, "function");
  const calls = [];
  const styles = {
    '[project]/src/app/layout': [{ path: 'static/css/root.css', inlined: false }],
    '[project]/src/app/about/layout': [{ path: 'static/css/root.css', inlined: false }],
    '[project]/src/app/about/page': [{ path: 'static/css/page.css', inlined: false }],
    '[project]/src/app/about/error': [{ path: 'static/css/error.css', inlined: false }],
    '[project]/src/app/other/page': [{ path: 'static/css/other.css', inlined: false }],
  };
  const rows = reporter.summarizeClientReferenceCss({ '/about/page': '/about' },
    page => referenceSource(page, styles), asset => {
      calls.push(asset);
      return { 'static/css/root.css': 100, 'static/css/page.css': 25 }[asset];
    });
  assert.deepEqual(rows, [{ route: '/about', appPath: '/about/page', cssBytes: 125, stylesheetCount: 2 }]);
  assert.deepEqual(calls.sort(), ['static/css/page.css', 'static/css/root.css']);
});

test("supports route groups, missing page-only CSS and explicit zero-style entries", () => {
  assert.equal(typeof reporter.summarizeClientReferenceCss, "function");
  const rows = reporter.summarizeClientReferenceCss({ '/admin/(protected)/team/page': '/admin/team', '/page': '/' },
    page => referenceSource(page, page === '/page' ? { '[project]/src/app/layout': [] } : {
      '[project]/src/app/layout': [{ path: 'static/css/root.css', inlined: false }],
      '[project]/src/app/admin/(protected)/layout': [{ path: 'static/css/admin.css', inlined: false }],
    }), () => 10);
  assert.deepEqual(rows, [
    { route: '/admin/team', appPath: '/admin/(protected)/team/page', cssBytes: 20, stylesheetCount: 2 },
    { route: '/', appPath: '/page', cssBytes: 0, stylesheetCount: 0 },
  ]);
});

test("attributes Next's generated global-error and not-found pages to their source entries", () => {
  for (const [page, entry] of [['/_global-error/page', '/global-error'], ['/_not-found/page', '/not-found']]) {
    const rows = reporter.summarizeClientReferenceCss({ [page]: page.replace('/page', '') },
      key => referenceSource(key, { ['[project]/src/app' + entry]: [{ path: 'static/css/error.css', inlined: false }] }), () => 12);
    assert.equal(rows[0].cssBytes, 12);
  }
});

test("rejects traversal, malformed CSS entries and unmeasured sizes instead of reporting zero", () => {
  assert.equal(typeof reporter.summarizeClientReferenceCss, "function");
  let read = false;
  assert.throws(() => reporter.summarizeClientReferenceCss({ '/../../page': '/' }, () => { read = true; }, () => 1), /path/);
  assert.equal(read, false);
  for (const value of [null, {}, 'static/css/root.css', [{ path: 'static/../outside.css', inlined: false }],
    [{ path: 'https://elsewhere.invalid/style.css', inlined: false }], [{ path: 'static/css/root.css', inlined: true }]]) {
    assert.throws(() => reporter.summarizeClientReferenceCss({ '/page': '/' },
      page => referenceSource(page, { '[project]/src/app/layout': value }), () => 1));
  }
  for (const size of [undefined, NaN, Infinity, -1, 1.5]) {
    assert.throws(() => reporter.summarizeClientReferenceCss({ '/page': '/' },
      page => referenceSource(page, { '[project]/src/app/layout': [{ path: 'static/css/root.css', inlined: false }] }), () => size), /size/);
  }
  assert.throws(() => reporter.summarizeClientReferenceCss({ '/page': '/' },
    page => referenceSource(page, { '[project]/unrelated/layout': [] }), () => 1), /entries/);
});

test("CLI reports assigned CSS separately from unattributed JS and preserves missing-manifest fallback", () => {
  const directory = mkdtempSync(join(tmpdir(), 'amaana-css-report-'));
  const build = join(directory, '.next');
  const cli = fileURLToPath(new URL('./report-route-bundles.mjs', import.meta.url));
  try {
    mkdirSync(join(build, 'server/app'), { recursive: true });
    mkdirSync(join(build, 'static/css'), { recursive: true });
    mkdirSync(join(build, 'static/chunks'), { recursive: true });
    writeFileSync(join(build, 'app-path-routes-manifest.json'), JSON.stringify({ '/page': '/' }));
    writeFileSync(join(build, 'static/css/root.css'), 'body{}');
    writeFileSync(join(build, 'static/chunks/shared.js'), 'void 0;');
    const run = () => spawnSync(process.execPath, [cli, '--json'], { cwd: directory, encoding: 'utf8', timeout: 5000 });
    const absent = run();
    assert.equal(absent.status, 0, absent.stderr);
    const fallback = JSON.parse(absent.stdout);
    assert.equal(fallback.cssRouteAttributionAvailable, false);
    assert.equal(fallback.cssRoutes, undefined);
    writeFileSync(join(build, 'server/app/page_client-reference-manifest.js'), referenceSource('/page', {
      '[project]/src/app/layout': [{ path: 'static/css/root.css', inlined: false }],
    }));
    const completed = run();
    assert.equal(completed.status, 0, completed.stderr);
    const report = JSON.parse(completed.stdout);
    assert.equal(report.routeAttributionAvailable, false);
    assert.equal(report.cssRouteAttributionAvailable, true);
    assert.equal(report.cssMetric, 'client-reference-assigned-uncompressed-css-bytes');
    assert.deepEqual(report.cssRoutes, [{ route: '/', appPath: '/page', cssBytes: 6, stylesheetCount: 1 }]);
    assert.equal(report.aggregate.jsBytes, 7);
    assert.equal(report.jsRouteAttributionAvailable, false);
    writeFileSync(join(build, 'build-manifest.json'), JSON.stringify({ rootMainFiles: ['static/chunks/shared.js'] }));
    const noJsMap = run();
    assert.equal(noJsMap.status, 0, noJsMap.stderr);
    assert.equal(JSON.parse(noJsMap.stdout).jsRouteAttributionAvailable, false);
    const withJs = {};
    withJs.entryCSSFiles = { '[project]/src/app/layout': [{ path: 'static/css/root.css', inlined: false }] };
    withJs.entryJSFiles = { '[project]/src/app/layout': ['static/chunks/shared.js'] };
    writeFileSync(join(build, 'server/app/page_client-reference-manifest.js'),
      'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};globalThis.__RSC_MANIFEST["/page"] = ' + JSON.stringify(withJs));
    const js = run();
    assert.equal(js.status, 0, js.stderr);
    const jsReport = JSON.parse(js.stdout);
    assert.equal(jsReport.routeAttributionAvailable, false);
    assert.equal(jsReport.jsRouteAttributionAvailable, true);
    assert.equal(jsReport.jsMetric, 'client-reference-assigned-uncompressed-js-bytes');
    assert.deepEqual(jsReport.jsRoutes, [{ route: '/', appPath: '/page', jsBytes: 7, scriptCount: 1 }]);
    withJs.entryJSFiles = null;
    writeFileSync(join(build, 'server/app/page_client-reference-manifest.js'),
      'globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};globalThis.__RSC_MANIFEST["/page"] = ' + JSON.stringify(withJs));
    const malformedJs = run();
    assert.equal(malformedJs.status, 1);
    assert.match(malformedJs.stderr, /JavaScript map/);
    assert.equal(malformedJs.stdout, '');
    writeFileSync(join(build, 'server/app/page_client-reference-manifest.js'), referenceSource('/wrong/page', {}));
    const mismatched = run();
    assert.equal(mismatched.status, 1);
    assert.match(mismatched.stderr, /identity/);
    assert.equal(mismatched.stdout, '');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

const jsReferenceSource = (page, entryJSFiles) => referenceSource(page, {})
  .replace('"entryCSSFiles":{}', '"entryCSSFiles":{},"entryJSFiles":' + JSON.stringify(entryJSFiles));

test("Next16 JS assignments include shared runtime and deduplicate all manifest segments", () => {
  assert.equal(typeof reporter.summarizeClientReferenceJs, "function");
  const sizes = { 'static/chunks/runtime.js': 7, 'static/chunks/shared.js': 11, 'static/chunks/page.js': 13 };
  const rows = reporter.summarizeClientReferenceJs({ '/donate/page': '/donate', '/page': '/' },
    page => jsReferenceSource(page, {
      '[project]/src/app/layout': ['static/chunks/shared.js'],
      '[project]/src/app/donate/page': page === '/page' ? [] : ['static/chunks/page.js', 'static/chunks/shared.js'],
    }), ['static/chunks/runtime.js', 'static/chunks/shared.js'], asset => sizes[asset]);
  assert.deepEqual(rows, [
    { route: '/donate', appPath: '/donate/page', jsBytes: 31, scriptCount: 3 },
    { route: '/', appPath: '/page', jsBytes: 18, scriptCount: 2 },
  ]);
});

test("Next16 JS assignments reject missing maps, malformed lists and unsafe assets", () => {
  assert.equal(typeof reporter.summarizeClientReferenceJs, "function");
  for (const map of [undefined, null, [], { a: null }, { a: ['../outside.js'] },
    { a: ['static/../outside.js'] }, { a: ['https://external.invalid/a.js'] }, { a: ['static/css/a.css'] }, { a: [42] }]) {
    assert.throws(() => reporter.summarizeClientReferenceJs({ '/page': '/' },
      page => jsReferenceSource(page, map), [], () => 1));
  }
  for (const roots of [undefined, null, {}, ['static/css/a.css'], ['../outside.js']]) {
    assert.throws(() => reporter.summarizeClientReferenceJs({ '/page': '/' },
      page => jsReferenceSource(page, {}), roots, () => 1));
  }
});

test("Next16 JS assignments reject wrong identities, traversal and absent sizes", () => {
  assert.equal(typeof reporter.summarizeClientReferenceJs, "function");
  assert.throws(() => reporter.summarizeClientReferenceJs({ '/page': '/' },
    () => jsReferenceSource('/wrong/page', {}), [], () => 1), /identity/);
  let read = false;
  assert.throws(() => reporter.summarizeClientReferenceJs({ '/../../page': '/' },
    () => { read = true; }, [], () => 1), /path/);
  assert.equal(read, false);
  for (const size of [undefined, -1, NaN, Infinity, 1.1]) {
    assert.throws(() => reporter.summarizeClientReferenceJs({ '/page': '/' },
      page => jsReferenceSource(page, { root: ['static/chunks/shared.js'] }), [], () => size), /size/);
  }
});
