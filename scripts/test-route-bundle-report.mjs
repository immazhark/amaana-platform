import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeAppRouteBundles, summarizeUnattributedAppAssets, parseClientReferenceManifest, summarizeClientReferenceBundles } from "./report-route-bundles.mjs";

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


test("parses actual Next 16 JSON wrapper without executing manifest code", () => {
  const data = { entryJSFiles: {}, entryCSSFiles: {} };
  assert.deepEqual(parseClientReferenceManifest(`globalThis.__RSC_MANIFEST = globalThis.__RSC_MANIFEST || {};\nglobalThis.__RSC_MANIFEST["/contact/page"] = ${JSON.stringify(data)};\n`), data);
  assert.throws(() => parseClientReferenceManifest('globalThis.__RSC_MANIFEST["/page"] = (() => { throw Error("executed"); })();'));
  assert.throws(() => parseClientReferenceManifest('globalThis.__RSC_MANIFEST["/page"] = {}; globalThis.marker = true;'));
  assert.throws(() => parseClientReferenceManifest('globalThis.__RSC_MANIFEST["/page"] = null;'), /Invalid/);
  assert.throws(() => parseClientReferenceManifest('{}'), /Unrecognized/);
});

test("Next 16 attributes grouped layouts, page entries, CSS objects and shared runtime once", () => {
  const sizes = { 'static/runtime.js': 100, 'static/root.js': 80, 'static/group.js': 30, 'static/page.js': 20, 'static/site.css': 15, 'static/page.css': 5 };
  const report = summarizeClientReferenceBundles({ '/(public)/about/page': '/about' }, {
    '/(public)/about/page': {
      entryJSFiles: {
        '[project]/src/app/layout': ['static/root.js', 'static/runtime.js'],
        '[project]/src/app/(public)/layout': ['static/group.js'],
        '[project]/src/app/(public)/about/page': ['/_next/static/page.js', 'static/root.js'],
        '[project]/src/app/error': ['static/error.js'],
        '[project]/src/app/twitter-image--metadata': ['static/metadata.js'],
      },
      entryCSSFiles: {
        '[project]/src/app/layout': [{ path: 'static/site.css', inlined: false }],
        '[project]/src/app/(public)/about/page': [{ path: 'static/page.css', inlined: false }, { path: 'static/site.css', inlined: false }],
      },
      clientModules: { panel: { chunks: ['static/on-demand.js'] } },
    },
  }, ['static/runtime.js'], asset => { assert.ok(Object.hasOwn(sizes, asset), asset); return sizes[asset]; });
  assert.equal(report.routeAttributionAvailable, true);
  assert.equal(report.completeRouteAttribution, true);
  assert.deepEqual(report.routes, [{ route: '/about', entries: 6, jsBytes: 230, cssBytes: 20, totalBytes: 250 }]);
});

test("Next 16 does not substitute shared assets for missing route attribution", () => {
  const report = summarizeClientReferenceBundles({ '/page': '/', '/missing/page': '/missing' }, {
    '/page': { entryJSFiles: { '[project]/src/app/page': ['static/page.js'] }, entryCSSFiles: {} },
    '/missing/page': { entryJSFiles: { '[project]/src/app/layout': ['static/shared.js'] }, entryCSSFiles: {} },
  }, [], () => 10);
  assert.equal(report.completeRouteAttribution, false);
  assert.deepEqual(report.unattributedRoutes, ['/missing']);
  assert.deepEqual(report.routes.map(row => row.route), ['/']);
});

test("Next 16 rejects invalid bytes and filters unsafe entry asset paths", () => {
  const manifests = { '/page': { entryJSFiles: { '[project]/src/app/page': ['../outside.js', 'static/../outside.js', 'https://example.com/file.js', 'static/page.js'] }, entryCSSFiles: {} } };
  const report = summarizeClientReferenceBundles({ '/page': '/' }, manifests, [], asset => { assert.equal(asset, 'static/page.js'); return 42; });
  assert.equal(report.routes[0].jsBytes, 42);
  for (const value of [-1, NaN, Infinity]) assert.throws(() => summarizeClientReferenceBundles({ '/page': '/' }, manifests, [], () => value), /Invalid bundle size/);
});
