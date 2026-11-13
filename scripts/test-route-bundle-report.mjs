import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
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

test("AF-R047 rejects malformed inherited layout asset lists instead of undercounting bytes", () => {
  const page = { "/page": ["static/chunks/page.js"] };
  for (const invalid of [null, "static/css/layout.css", 42, { path: "static/css/layout.css" }]) {
    assert.throws(() => summarizeAppRouteBundles({ ...page, "/layout": invalid }, () => 10),
      /Invalid App Router layout asset list/);
    assert.throws(() => summarizeAppRouteBundles({
      ...page, "/about/page": ["static/chunks/page.js"], "/about/layout": invalid,
    }, () => 10), /Invalid App Router layout asset list/);
  }
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

test("unattributed build aggregate rejects duplicated paths rather than inflating byte totals", () => {
  const pages = { "/page": "/" };
  for (const records of [
    [{ path: "chunks/shared.js", bytes: 11 }, { path: "chunks/shared.js", bytes: 11 }],
    [{ path: "css/site.css", bytes: 9 }, { path: "css/site.css", bytes: 13 }],
  ]) {
    assert.throws(() => summarizeUnattributedAppAssets(pages, records), /Duplicate aggregate asset path/);
  }
  const valid = summarizeUnattributedAppAssets(pages, [
    { path: "chunks/shared.js", bytes: 11 },
    { path: "css/site.css", bytes: 13 },
  ]);
  assert.deepEqual(valid.aggregate, { jsBytes: 11, cssBytes: 13, totalBytes: 24, assetCount: 2 });
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

test("AF-R047 rejects malformed unselected CSS manifest entries before reporting route totals", () => {
  // The manifest is trusted as a single measurement artifact, even when the
  // malformed entry belongs to a sibling page or an unused error boundary.
  const current = "[project]/src/app/layout";
  const sibling = "[project]/src/app/about/error";
  const invalid = [
    ["null entry", null],
    ["string entry", "static/css/other.css"],
    ["numeric entry", 1],
    ["non-object item", [null]],
    ["inlined item", [{ path: "static/css/other.css", inlined: true }]],
    ["untrusted origin", [{ path: "https://invalid.example/other.css", inlined: false }]],
    ["path traversal", [{ path: "static/../outside.css", inlined: false }]],
    ["missing path", [{ inlined: false }]],
  ];
  for (const [label, value] of invalid) {
    assert.throws(() => reporter.summarizeClientReferenceCss(
      { "/page": "/" },
      page => referenceSource(page, { [current]: [], [sibling]: value }),
      () => { throw new Error("No stylesheet sizes should be read"); },
    ), /Invalid client-reference CSS entries|Unsupported or inline CSS entry|Unsafe client-reference CSS asset path/,
    label);
  }
  assert.deepEqual(reporter.summarizeClientReferenceCss(
    { "/page": "/" },
    page => referenceSource(page, {
      [current]: [{ path: "static/css/home.css", inlined: false }],
      [sibling]: [{ path: "static/css/other.css", inlined: false }],
    }),
    asset => {
      assert.equal(asset, "static/css/home.css", "Sibling CSS must not inflate the measured route");
      return 9;
    },
  ), [{ route: "/", appPath: "/page", cssBytes: 9, stylesheetCount: 1 }]);
});

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
      page => jsReferenceSource(page, { '[project]/src/app/layout': ['static/chunks/shared.js'] }), [], () => size), /size/);
  }
});


test("Next16 JS excludes sibling pages while retaining root and ancestor layout assets", () => {
  const sizes = {
    "static/chunks/runtime.js": 7,
    "static/chunks/shared.js": 11,
    "static/chunks/home.js": 17,
    "static/chunks/appeals-layout.js": 5,
    "static/chunks/appeals.js": 13,
  };
  const entryJSFiles = {
    "[project]/src/app/layout": ["static/chunks/shared.js"],
    "[project]/src/app/page": ["static/chunks/home.js"],
    "[project]/src/app/appeals/layout": ["static/chunks/appeals-layout.js"],
    "[project]/src/app/appeals/page": ["static/chunks/appeals.js"],
  };
  const rows = reporter.summarizeClientReferenceJs({
    "/page": "/", "/appeals/page": "/appeals",
  }, page => jsReferenceSource(page, entryJSFiles),
  ["static/chunks/runtime.js"], asset => {
    assert.ok(Object.hasOwn(sizes, asset), asset);
    return sizes[asset];
  });
  const byRoute = Object.fromEntries(rows.map(row => [row.route, row]));
  assert.deepEqual(byRoute["/"], {
    route: "/", appPath: "/page", jsBytes: 35, scriptCount: 3,
  });
  assert.deepEqual(byRoute["/appeals"], {
    route: "/appeals", appPath: "/appeals/page", jsBytes: 36, scriptCount: 4,
  });
});

test("Next16 JS rejects duplicate manifest keys claiming the same layout", () => {
  const manifest = {
    "[project]/src/app/layout": ["static/chunks/a.js"],
    "[other]/src/app/layout": ["static/chunks/b.js"],
  };
  assert.throws(() => reporter.summarizeClientReferenceJs({ "/page": "/" },
    page => jsReferenceSource(page, manifest), [], () => 1),
    /Ambiguous client-reference JavaScript entries/);
});


test("Next16 JS attributes pathless overview route layouts without sibling detail page chunks", () => {
  const sizes = {
    "static/chunks/runtime.js": 13,
    "static/chunks/root.js": 2,
    "static/chunks/stories-layout.js": 3,
    "static/chunks/overview-layout.js": 5,
    "static/chunks/overview.js": 7,
    "static/chunks/detail.js": 11,
  };
  const entries = {
    "[project]/src/app/layout": ["static/chunks/root.js"],
    "[project]/src/app/stories/layout": ["static/chunks/stories-layout.js"],
    "[project]/src/app/stories/(overview)/layout": ["static/chunks/overview-layout.js"],
    "[project]/src/app/stories/(overview)/page": ["static/chunks/overview.js"],
    "[project]/src/app/stories/[slug]/page": ["static/chunks/detail.js"],
  };
  const rows = reporter.summarizeClientReferenceJs(
    { "/stories/(overview)/page": "/stories" },
    page => jsReferenceSource(page, entries),
    ["static/chunks/runtime.js"],
    asset => {
      assert.ok(Object.hasOwn(sizes, asset), asset);
      return sizes[asset];
    },
  );
  assert.deepEqual(rows, [{
    route: "/stories",
    appPath: "/stories/(overview)/page",
    jsBytes: 30,
    scriptCount: 5,
  }]);
});

test("Next16 per-route CSS totals reject unsafe integer overflow but accept the exact boundary", () => {
  const styles = { "[project]/src/app/layout": [
    { path: "static/css/large.css", inlined: false },
    { path: "static/css/small.css", inlined: false },
  ] };
  const report = size => reporter.summarizeClientReferenceCss({ "/page": "/" },
    page => referenceSource(page, styles),
    asset => asset.endsWith("large.css") ? size : 1);
  assert.throws(() => report(Number.MAX_SAFE_INTEGER), /Invalid CSS total size/);
  assert.deepEqual(report(Number.MAX_SAFE_INTEGER - 1), [{
    route: "/", appPath: "/page", cssBytes: Number.MAX_SAFE_INTEGER, stylesheetCount: 2,
  }]);
});

test("Next16 per-route JS totals reject unsafe integer overflow but accept the exact boundary", () => {
  const scripts = { "[project]/src/app/layout": [
    "static/chunks/large.js", "static/chunks/small.js",
  ] };
  const report = size => reporter.summarizeClientReferenceJs({ "/page": "/" },
    page => jsReferenceSource(page, scripts), [],
    asset => asset.endsWith("large.js") ? size : 1);
  assert.throws(() => report(Number.MAX_SAFE_INTEGER), /Invalid JavaScript total size/);
  assert.deepEqual(report(Number.MAX_SAFE_INTEGER - 1), [{
    route: "/", appPath: "/page", jsBytes: Number.MAX_SAFE_INTEGER, scriptCount: 2,
  }]);
});

test("CLI tolerates a closed output reader while malformed builds still fail", async () => {
  const directory = mkdtempSync(join(tmpdir(), "amaana-report-closed-output-"));
  const cli = fileURLToPath(new URL("./report-route-bundles.mjs", import.meta.url));
  try {
    mkdirSync(join(directory, ".next/static"), { recursive: true });
    writeFileSync(join(directory, ".next/app-path-routes-manifest.json"), JSON.stringify({ "/page": "/" }));
    const result = await new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [cli, "--json"], {
        cwd: directory, stdio: ["ignore", "pipe", "pipe"], timeout: 5000,
      });
      let stderr = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", chunk => { stderr += chunk; });
      child.on("error", reject);
      child.on("close", (status, signal) => resolve({ status, signal, stderr }));
      // Close before the first CLI write, independent of pipe buffer capacity.
      child.stdout.destroy();
    });
    assert.equal(result.signal, null);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stderr, "");
    const outputError = join(directory, "output-error.mjs");
    writeFileSync(outputError, 'setImmediate(() => process.stdout.emit("error", Object.assign(new Error("synthetic output failure"), { code: "EIO" })));');
    const failedOutput = spawnSync(process.execPath, ["--import", outputError, cli], {
      cwd: directory, encoding: "utf8", timeout: 5000,
    });
    assert.equal(failedOutput.status, 1);
    assert.match(failedOutput.stderr, /Unable to write route report: synthetic output failure/);
    assert.match(failedOutput.stdout, /App Router pages: 1/);
    writeFileSync(join(directory, ".next/app-path-routes-manifest.json"), "invalid json");
    const malformed = spawnSync(process.execPath, [cli], { cwd: directory, encoding: "utf8", timeout: 5000 });
    assert.equal(malformed.status, 1);
    assert.notEqual(malformed.stderr, "");
    assert.equal(malformed.stdout, "");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});


test("AF-R047 rejects malformed page asset lists instead of silently omitting routes", () => {
  const valid = { "/page": [], "/about/page": [] };
  assert.equal(summarizeAppRouteBundles(valid, () => 0).length, 2);
  for (const malformed of [null, undefined, {}, "static/chunks/a.js", 0]) {
    assert.throws(() => summarizeAppRouteBundles({
      "/page": malformed,
      "/about/page": [],
    }, () => 0), /Invalid App Router page asset list/);
  }
});

for (const [label, invalid] of [["null", null], ["boolean", false], ["number", 7], ["array", []], ["object", {}], ["empty", ""]]) {
  for (const kind of ["aggregate", "CSS", "JavaScript"]) {
    test(`AF-R047 rejects ${label} page route values in ${kind} inventory`, () => {
      const pages = { "/page": "/", "/donate/page": invalid };
      const readManifest = page => jsReferenceSource(page, { "[project]/src/app/layout": [] })
        .replace('"entryCSSFiles":{}', '"entryCSSFiles":{"[project]/src/app/layout":[]}');
      assert.throws(() => {
        if (kind === "aggregate") return summarizeUnattributedAppAssets(pages, []);
        if (kind === "CSS") return reporter.summarizeClientReferenceCss(pages, readManifest, () => 0);
        return reporter.summarizeClientReferenceJs(pages, readManifest, [], () => 0);
      }, /Invalid App Router page route/);
    });
  }
}

test("AF-R047 rejects malformed unmatched legacy layout manifest entries", () => {
  const selected = {
    "/layout": ["static/chunks/root.js"],
    "/page": ["static/chunks/home.js"],
    "/about/page": ["static/chunks/about.js"],
  };
  const valid = summarizeAppRouteBundles({
    ...selected,
    "/unselected/layout": ["static/chunks/unused.js"],
  }, () => 5);
  assert.equal(valid.length, 2);
  assert.equal(valid.find(row => row.route === "/").jsBytes, 10,
    "Unrelated valid layout resources must not inflate the selected route");
  for (const value of [null, "static/chunks/unused.js", 1, { path: "static/chunks/unused.js" }]) {
    assert.throws(() => summarizeAppRouteBundles({
      ...selected,
      "/unselected/layout": value,
    }, () => 5), /Invalid App Router layout asset list/,
    "Malformed sibling layouts must not silently pass the integrity audit");
  }
});

test("AF-R047 does not double-count aliased on-disk bundle paths", () => {
  const legacy = summarizeAppRouteBundles({
    "/page": [
      "static/chunks/shared.js",
      "static/chunks/./shared.js",
      "static/chunks//shared.js",
    ],
  }, asset => {
    assert.equal(asset, "static/chunks/shared.js", "Only canonical asset paths may be measured");
    return 13;
  });
  assert.equal(legacy[0].jsBytes, 13,
    "One on-disk file must not be counted as three different manifest assets");

  for (const path of [
    "static/css/./site.css",
    "static/css//site.css",
    "static/css/hidden/../site.css",
  ]) {
    assert.throws(() => reporter.summarizeClientReferenceCss(
      { "/page": "/" },
      page => referenceSource(page, {
        "[project]/src/app/layout": [{ path, inlined: false }],
      }),
      () => 17,
    ), /Unsafe client-reference CSS asset path/, path);
  }

  for (const path of [
    "static/chunks/./shared.js",
    "static/chunks//shared.js",
    "static/chunks/hidden/../shared.js",
  ]) {
    assert.throws(() => reporter.summarizeClientReferenceJs(
      { "/page": "/" },
      page => jsReferenceSource(page, {
        "[project]/src/app/layout": [path],
      }),
      ["static/chunks/runtime.js"], () => 13,
    ), /Unsafe JavaScript asset path/, path);
  }

  const canonical = summarizeAppRouteBundles({
    "/layout": ["static/chunks/shared.js"],
    "/page": ["static/chunks/shared.js"],
  }, asset => {
    assert.equal(asset, "static/chunks/shared.js");
    return 13;
  });
  assert.equal(canonical[0].jsBytes, 13,
    "Canonical inherited and page assets must still deduplicate");
});


test("AF-R047 rejects noncanonical dot-segment App Router pages before asset attribution", () => {
  const path = "/stories/./page";
  const routes = { [path]: "/stories" };
  let manifestReads = 0;
  assert.throws(() => summarizeAppRouteBundles({
    [path]: ["static/chunks/story.js"],
  }, () => 7), /Unsafe App Router page path/);
  assert.throws(() => summarizeUnattributedAppAssets(routes, []), /Unsafe App Router page path/);
  assert.throws(() => reporter.summarizeClientReferenceCss(routes,
    page => {
      manifestReads += 1;
      return referenceSource(page, {
        "[project]/src/app/layout": [{ path: "static/css/base.css", inlined: false }],
      });
    }, () => 7), /Unsafe App Router page path/);
  assert.throws(() => reporter.summarizeClientReferenceJs(routes,
    page => {
      manifestReads += 1;
      return jsReferenceSource(page, {
        "[project]/src/app/layout": ["static/chunks/base.js"],
      });
    }, [], () => 7), /Unsafe App Router page path/);
  assert.equal(manifestReads, 0, "Reject malformed paths before reading their manifest");
  const valid = summarizeUnattributedAppAssets({
    "/stories/(overview)/page": "/stories",
  }, []);
  assert.deepEqual(valid.routes, ["/stories"], "Existing route-group paths stay valid");
});


test("AF-R047 rejects malformed public route labels before reading client-reference files", () => {
  const invalidRoutes = [
    "stories",
    "//external.example",
    "/stories/./draft",
    "/stories/../draft",
    "/stories//draft",
    "/stories?draft=1",
    "/stories#private",
    "/stories\\private",
    "/stories\nprivate",
    "/stories/%2e%2e/private",
    "/stories/%2Fprivate",
    "/stories/a%2Fb",
    "/stories/a%252Fb",
    "/stories/%252e%252e/private",
    "/stories/%5cprivate",
  ];
  for (const route of invalidRoutes) {
    const paths = { "/page": route };
    assert.throws(() => summarizeUnattributedAppAssets(paths, []),
      /Invalid App Router page route/, route);
    let reads = 0;
    assert.throws(() => reporter.summarizeClientReferenceCss(paths,
      page => {
        reads += 1;
        return referenceSource(page, { "[project]/src/app/layout": [] });
      }, () => 1), /Invalid App Router page route/, route);
    assert.throws(() => reporter.summarizeClientReferenceJs(paths,
      page => {
        reads += 1;
        return jsReferenceSource(page, { "[project]/src/app/layout": [] });
      }, [], () => 1), /Invalid App Router page route/, route);
    assert.equal(reads, 0, "Invalid route labels must fail before client-reference file reads");
  }
  for (const route of ["/", "/stories", "/stories/[slug]", "/(public)/stories"]) {
    const report = summarizeUnattributedAppAssets({ "/page": route }, []);
    assert.deepEqual(report.routes, [route], "Normal App Router labels remain accepted");
  }
});


test("AF-R047 rejects doubled Next asset-prefix separators without rejecting canonical assets", () => {
  const cssEntry = path => referenceSource("/page", {
    "[project]/src/app/layout": [{ path, inlined: false }],
  });
  for (const path of ["/_next//static/css/site.css", "_next//static/css/site.css"]) {
    assert.throws(() => reporter.summarizeClientReferenceCss(
      { "/page": "/" }, () => cssEntry(path), () => 11,
    ), /Unsafe client-reference CSS asset path/, path);
  }
  for (const path of ["/_next//static/chunks/app.js", "_next//static/chunks/app.js"]) {
    assert.throws(() => reporter.summarizeClientReferenceJs(
      { "/page": "/" }, page => jsReferenceSource(page, {
        "[project]/src/app/layout": [path],
      }), [], () => 13,
    ), /Unsafe JavaScript asset path/, path);
    assert.throws(() => reporter.summarizeClientReferenceJs(
      { "/page": "/" }, page => jsReferenceSource(page, {}), [path], () => 13,
    ), /Unsafe JavaScript asset path/, path);
  }
  assert.equal(reporter.summarizeClientReferenceCss(
    { "/page": "/" }, () => cssEntry("/_next/static/css/site.css"), () => 11,
  )[0].cssBytes, 11);
  assert.equal(reporter.summarizeClientReferenceJs(
    { "/page": "/" }, page => jsReferenceSource(page, {
      "[project]/src/app/layout": ["/_next/static/chunks/app.js"],
    }), [], () => 13,
  )[0].jsBytes, 13);
});

for (const [label, entries] of [
  ["sibling page", { "[project]/src/app/other/page": ["static/chunks/other.js"] }],
  ["unrelated layout", { "[project]/src/app/other/layout": [] }],
  ["unrelated error", { "[project]/src/app/global-error": [] }],
]) {
  for (const shared of [[], ["static/chunks/runtime.js"]]) {
    test(`AF-R047 rejects unmatched nonempty JS map: ${label}, shared=${shared.length}`, () => {
      let measured = false;
      assert.throws(() => reporter.summarizeClientReferenceJs(
        { "/donate/page": "/donate" },
        page => jsReferenceSource(page, entries), shared,
        () => { measured = true; return 100; },
      ), /No matching client-reference JavaScript entries/);
      assert.equal(measured, false, "Mismatched attribution must fail before measuring shared assets");
    });
  }
}

test("AF-R047 preserves empty JS maps and matching empty ancestor entries", () => {
  for (const entries of [{}, { "[project]/src/app/layout": [] }]) {
    const rows = reporter.summarizeClientReferenceJs(
      { "/donate/page": "/donate" }, page => jsReferenceSource(page, entries),
      ["static/chunks/runtime.js"], () => 100,
    );
    assert.deepEqual(rows, [{ route: "/donate", appPath: "/donate/page", jsBytes: 100, scriptCount: 1 }]);
  }
});

for (const kind of ["js", "css", "directory", "root"]) {
  test(`AF-R047 rejects symlinked static build assets: ${kind}`, () => {
    const directory = mkdtempSync(join(tmpdir(), "amaana-symlink-assets-"));
    try {
      const build = join(directory, ".next");
      const actual = join(directory, "synthetic-assets");
      mkdirSync(build);
      mkdirSync(actual);
      writeFileSync(join(actual, "asset.js"), "synthetic");
      writeFileSync(join(actual, "asset.css"), "synthetic");
      writeFileSync(join(build, "app-path-routes-manifest.json"), JSON.stringify({ "/page": "/" }));
      if (kind === "root") {
        symlinkSync(actual, join(build, "static"), "dir");
      } else {
        mkdirSync(join(build, "static"));
        symlinkSync(kind === "directory" ? actual : join(actual, `asset.${kind}`),
          join(build, "static", kind === "directory" ? "nested" : `asset.${kind}`),
          kind === "directory" ? "dir" : "file");
      }
      const cli = fileURLToPath(new URL("./report-route-bundles.mjs", import.meta.url));
      const result = spawnSync(process.execPath, [cli, "--json"], {
        cwd: directory, encoding: "utf8", timeout: 5000,
      });
      assert.equal(result.status, 1, "Symlinked assets must not produce a successful byte report");
      assert.equal(result.stdout, "");
      assert.match(result.stderr, /Symbolic links are not supported in static build assets/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

for (const kind of ["file", "parent-directory", "static-root", "build-root"]) {
  test(`AF-R047 legacy build-manifest rejects symlinked static asset path: ${kind}`, () => {
    const directory = mkdtempSync(join(tmpdir(), "amaana-legacy-manifest-symlink-"));
    try {
      const actual = join(directory, "synthetic-outside");
      const build = join(directory, ".next");
      const manifest = JSON.stringify({ pages: { "/page": ["static/chunks/asset.js"] } });
      mkdirSync(join(actual, "chunks"), { recursive: true });
      writeFileSync(join(actual, "chunks", "asset.js"), "synthetic outside bytes");
      if (kind === "build-root") {
        mkdirSync(join(actual, "static", "chunks"), { recursive: true });
        writeFileSync(join(actual, "static", "chunks", "asset.js"), "synthetic outside bytes");
        writeFileSync(join(actual, "app-build-manifest.json"), manifest);
        symlinkSync(actual, build, "dir");
      } else {
        mkdirSync(build);
        writeFileSync(join(build, "app-build-manifest.json"), manifest);
        if (kind === "static-root") {
          symlinkSync(actual, join(build, "static"), "dir");
        } else {
          mkdirSync(join(build, "static"));
          if (kind === "parent-directory") {
            symlinkSync(join(actual, "chunks"), join(build, "static", "chunks"), "dir");
          } else {
            mkdirSync(join(build, "static", "chunks"));
            symlinkSync(join(actual, "chunks", "asset.js"),
              join(build, "static", "chunks", "asset.js"), "file");
          }
        }
      }
      const cli = fileURLToPath(new URL("./report-route-bundles.mjs", import.meta.url));
      const result = spawnSync(process.execPath, [cli, "--json"], {
        cwd: directory, encoding: "utf8", timeout: 5000,
      });
      assert.equal(result.status, 1, "Legacy manifest attribution must not follow a symlink");
      assert.equal(result.stdout, "", "Failed reports must not emit a partial JSON audit");
      assert.match(result.stderr, /Symbolic links are not supported in static build assets/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

for (const kind of ["file", "broken-file", "app-directory", "server-directory"]) {
  test(`AF-R047 rejects symlinked client-reference manifest paths: ${kind}`, () => {
    const directory = mkdtempSync(join(tmpdir(), "amaana-client-manifest-symlink-"));
    const build = join(directory, ".next");
    const out = join(directory, "external-manifests");
    const cli = fileURLToPath(new URL("./report-route-bundles.mjs", import.meta.url));
    try {
      mkdirSync(join(build, "static/css"), { recursive: true });
      mkdirSync(join(build, "static/chunks"), { recursive: true });
      mkdirSync(out, { recursive: true });
      writeFileSync(join(build, "app-path-routes-manifest.json"), JSON.stringify({ "/page": "/" }));
      writeFileSync(join(build, "static/css/root.css"), "body{}");
      writeFileSync(join(build, "static/chunks/site.js"), "void 0");
      const payload = referenceSource("/page", {
        "[project]/src/app/layout": [{ path: "static/css/root.css", inlined: false }],
      });
      const filename = "page_client-reference-manifest.js";
      if (kind === "file" || kind === "broken-file") {
        mkdirSync(join(build, "server/app"), { recursive: true });
        if (kind === "file") writeFileSync(join(out, filename), payload);
        symlinkSync(join(out, filename), join(build, "server/app", filename), "file");
      } else if (kind === "app-directory") {
        mkdirSync(join(build, "server"), { recursive: true });
        writeFileSync(join(out, filename), payload);
        symlinkSync(out, join(build, "server/app"), "dir");
      } else {
        mkdirSync(join(out, "app"), { recursive: true });
        writeFileSync(join(out, "app", filename), payload);
        symlinkSync(out, join(build, "server"), "dir");
      }
      const result = spawnSync(process.execPath, [cli, "--json"], {
        cwd: directory, encoding: "utf8", timeout: 5000,
      });
      assert.equal(result.status, 1, "Untrusted manifest links must never yield a successful audit");
      assert.equal(result.stdout, "", "No partial route-byte report may be emitted");
      assert.match(result.stderr, /Symbolic links are not supported in client-reference manifests/);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}

for (const filename of ['app-build-manifest.json', 'app-path-routes-manifest.json', 'build-manifest.json']) {
  for (const broken of [false, true]) {
    test(`AF-R047 rejects ${broken ? 'broken ' : ''}symlinked build metadata: ${filename}`, () => {
      const directory = mkdtempSync(join(tmpdir(), 'amaana-metadata-link-'));
      const build = join(directory, '.next');
      const cli = fileURLToPath(new URL('./report-route-bundles.mjs', import.meta.url));
      try {
        mkdirSync(join(build, 'static'), { recursive: true });
        mkdirSync(join(build, 'server/app'), { recursive: true });
        const metadata = {
          'app-build-manifest.json': { pages: { '/page': [] } },
          'app-path-routes-manifest.json': { '/page': '/' },
          'build-manifest.json': { rootMainFiles: [] },
        };
        writeFileSync(join(build, 'app-path-routes-manifest.json'), JSON.stringify(metadata['app-path-routes-manifest.json']));
        writeFileSync(join(build, 'server/app/page_client-reference-manifest.js'),
          jsReferenceSource('/page', {}).replace('"entryCSSFiles":{}', '"entryCSSFiles":{"[project]/src/app/layout":[]}'));
        const outside = join(directory, 'external-metadata.json');
        if (!broken) writeFileSync(outside, JSON.stringify(metadata[filename]));
        rmSync(join(build, filename), { force: true });
        symlinkSync(outside, join(build, filename));
        const result = spawnSync(process.execPath, [cli, '--json'], { cwd: directory, encoding: 'utf8', timeout: 5000 });
        assert.equal(result.status, 1, 'Linked metadata must not produce successful attribution or an unavailable fallback');
        assert.equal(result.stdout, '');
        assert.match(result.stderr, /Symbolic links are not supported in build metadata/);
      } finally {
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }
}
