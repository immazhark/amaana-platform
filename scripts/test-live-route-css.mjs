import assert from "node:assert/strict";
import { test } from "node:test";
import { stylesheetsInHtml, summarizeRouteCssBytes, auditPublicRouteCss } from "./audit-live-route-css.mjs";
import { mergeCssRanges, summarizeCssRuleUsage } from "../e2e/css-rule-coverage-core.mjs";

test("merges overlapping and adjacent CSS usage ranges without double counting", () => {
  assert.deepEqual(mergeCssRanges([{ start: 0, end: 3 }, { start: 2, end: 5 }, { start: 5, end: 7 }, { start: 9, end: 10 }], 10), [
    { start: 0, end: 7 }, { start: 9, end: 10 },
  ]);
  for (const ranges of [[{ start: -1, end: 2 }], [{ start: 1, end: 99 }], [{ start: 4, end: 2 }], [{ start: 1.5, end: 2 }]]) {
    assert.throws(() => mergeCssRanges(ranges, 10), /range/i);
  }
});

test("summarizes shared build CSS once per URL and accounts for UTF-8 decoded bytes", () => {
  const url = "http://127.0.0.1:3000/_next/static/chunks/public.css";
  const report = summarizeCssRuleUsage([
    { url, text: "aébcdef", ranges: [{ start: 0, end: 2 }] },
    { url, text: "aébcdef", ranges: [{ start: 1, end: 4 }] },
  ], "http://127.0.0.1:3000");
  assert.equal(report.metric, "sampled-chromium-css-usage-decoded-bytes");
  assert.deepEqual(report.stylesheets, [{ url, totalDecodedBytes: 8, usedDecodedBytes: 5 }]);
  assert.equal(report.excluded.inline, 0);
  assert.match(report.disclaimer, /Not network transfer|not network transfer/i);
});

test("marks missing browser stylesheet text as unmeasured, never zero", () => {
  const url = "http://127.0.0.1:3000/_next/static/chunks/missing.css";
  const report = summarizeCssRuleUsage([{ url, ranges: [{ start: 0, end: 2 }] }], "http://127.0.0.1:3000");
  assert.deepEqual(report.stylesheets, [{ url, totalDecodedBytes: null, usedDecodedBytes: null }]);
  assert.equal(report.unmeasuredStylesheets, 1);
  assert.equal(report.measuredTotalDecodedBytes, 0);
});

test("excludes inline, cross-origin and non-build styles without exposing their text", () => {
  const report = summarizeCssRuleUsage([
    { url: "", text: "x{}", ranges: [] },
    { url: "https://foreign.invalid/_next/static/chunks/x.css", text: "x{}", ranges: [] },
    { url: "http://127.0.0.1:3000/private.css", text: "x{}", ranges: [] },
  ], "http://127.0.0.1:3000");
  assert.deepEqual(report.stylesheets, []);
  assert.deepEqual(report.excluded, { inline: 1, crossOrigin: 1, nonBuild: 1 });
});

test("rejects malformed URL, conflicting CSS text and out-of-bounds usage ranges", () => {
  const url = "http://127.0.0.1:3000/_next/static/chunks/site.css";
  assert.throws(() => summarizeCssRuleUsage([{ url: "http://[", text: "x{}", ranges: [] }], "http://127.0.0.1:3000"), /URL/i);
  assert.throws(() => summarizeCssRuleUsage([
    { url, text: "a{}", ranges: [] }, { url, text: "b{}", ranges: [] },
  ], "http://127.0.0.1:3000"), /conflict|mismatch/i);
  assert.throws(() => summarizeCssRuleUsage([{ url, text: "x{}", ranges: [{ start: 0, end: 5 }] }], "http://127.0.0.1:3000"), /range/i);
});

test("counts same-origin built CSS links, independent of attribute order", () => {
  const html = [
    '<link href="/_next/static/chunks/base.css" rel="stylesheet">',
    "<link rel='preload stylesheet' crossorigin href='https://amaanafoundation.org/_next/static/chunks/route.css'>",
    "<link href='/_next/static/chunks/base.css' rel='stylesheet'>",
    "<link rel='stylesheet' href='https://foreign.invalid/_next/static/chunks/evil.css'>",
    "<link rel='stylesheet' href='/some/site.css'>",
    "<link rel='stylesheet' href='/_next/static/chunks/unsafe.js'>",
    "<link rel='stylesheet' href='https://user:pass@amaanafoundation.org/_next/static/chunks/unsafe.css'>",
  ].join("");
  assert.deepEqual(stylesheetsInHtml(html, "https://amaanafoundation.org"), [
    "https://amaanafoundation.org/_next/static/chunks/base.css",
    "https://amaanafoundation.org/_next/static/chunks/route.css",
  ]);
});

test("fails on invalid input and handles unquoted hrefs", () => {
  assert.throws(() => stylesheetsInHtml(null, "https://amaanafoundation.org"), /HTML/);
  assert.throws(() => stylesheetsInHtml("", "data:text/plain,a"), /HTTP/);
  assert.deepEqual(
    stylesheetsInHtml("<link rel=stylesheet href=/_next/static/chunks/site.css>", "https://amaanafoundation.org"),
    ["https://amaanafoundation.org/_next/static/chunks/site.css"],
  );
});

test("sums CSS per route without double-counting shared resources", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  const summary = summarizeRouteCssBytes([
    { route: "/", stylesheets: [a] },
    { route: "/impact", stylesheets: [a, b, b] },
  ], new Map([[a, 120], [b, 80]]));
  assert.deepEqual(summary.routes, [
    { route: "/", stylesheetCount: 1, cssBytes: 120 },
    { route: "/impact", stylesheetCount: 2, cssBytes: 200 },
  ]);
  assert.deepEqual(summary.shared, { uniqueStylesheets: 2, decodedCssBytes: 200 });
  assert.throws(() => summarizeRouteCssBytes([{ route: "/", stylesheets: ["missing"] }], new Map()), /Missing CSS size/);
});

test("audits only public routes and keeps decoded CSS distinct from transfer and CWV", async () => {
  const responses = new Map([
    ["https://amaanafoundation.org/", "<link rel='stylesheet' href='/_next/static/site.css'>"],
    ["https://amaanafoundation.org/impact", "<link rel='stylesheet' href='/_next/static/site.css'><link rel='stylesheet' href='/_next/static/impact.css'>"],
    ["https://amaanafoundation.org/_next/static/site.css", "a{color:red}"],
    ["https://amaanafoundation.org/_next/static/impact.css", "main{display:block}"],
  ]);
  const calls = [];
  const fetchImpl = async url => {
    calls.push(url);
    const value = responses.get(url);
    if (!value) throw new Error("Unexpected request " + url);
    return { ok: true, url, headers: { get: () => url.endsWith(".css") ? "text/css; charset=UTF-8" : "text/html" }, text: async () => value, arrayBuffer: async () => new TextEncoder().encode(value).buffer };
  };
  const report = await auditPublicRouteCss({ fetchImpl, routes: ["/", "/impact"] });
  assert.equal(report.metric, "rendered-public-route-decoded-css-bytes");
  assert.deepEqual(report.routes.map(x => x.cssBytes), [12, 31]);
  assert.equal(report.shared.uniqueStylesheets, 2);
  assert.equal(calls.length, 4);
  assert.match(report.disclaimer, /Not compressed transfer/);
});

test("rejects off-origin redirects and malformed route inputs", async () => {
  const fetchImpl = async () => ({
    ok: true, url: "https://foreign.invalid/", text: async () => "",
    arrayBuffer: async () => new ArrayBuffer(0),
  });
  await assert.rejects(auditPublicRouteCss({ fetchImpl, routes: ["/"] }), /unexpected origin/);
  await assert.rejects(auditPublicRouteCss({ fetchImpl, routes: ["//foreign.invalid"] }), /Invalid public route/);
});

test("rejects a non-CSS HTTP 200 fallback at a stylesheet URL", async () => {
  const fetchImpl = async url => ({
    ok: true, url, headers: { get: () => "text/html" },
    text: async () => '<link rel="stylesheet" href="/_next/static/fallback.css">',
    arrayBuffer: async () => new TextEncoder().encode("fallback").buffer,
  });
  await assert.rejects(auditPublicRouteCss({ fetchImpl, routes: ["/"] }), /not CSS/);
});

test("rejects a URL backslash normalization before any network request", async () => {
  let called = false;
  await assert.rejects(auditPublicRouteCss({
    routes: ["/\\evil.invalid"],
    fetchImpl: async () => { called = true; throw new Error("foreign request was made"); },
  }), /Invalid public route/);
  assert.equal(called, false);
});


test("never follows redirects before validating the response origin", async () => {
  const visited = [];
  const fetchImpl = async (url, options) => {
    visited.push(url);
    if (options.redirect === "follow") {
      visited.push("https://external.invalid/unsafe");
      return { ok: true, status: 200, url: "https://external.invalid/unsafe", text: async () => "" };
    }
    assert.equal(options.redirect, "manual");
    return { ok: false, status: 302, url, headers: { get: () => "https://external.invalid/unsafe" } };
  };
  await assert.rejects(
    auditPublicRouteCss({ fetchImpl, routes: ["/"] }),
    /HTTP error|Redirect not permitted/,
  );
  assert.deepEqual(visited, ["https://amaanafoundation.org/"]);
});
