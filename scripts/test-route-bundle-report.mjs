import assert from "node:assert/strict";
import { test } from "node:test";
import { summarizeAppRouteBundles, summarizeUnattributedAppAssets } from "./report-route-bundles.mjs";

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
