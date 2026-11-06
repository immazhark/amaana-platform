import assert from "node:assert/strict";
import { test } from "node:test";
import { stylesheetsInHtml, summarizeRouteCssBytes, auditPublicRouteCss } from "./audit-live-route-css.mjs";
import { mergeCssRanges, summarizeCssRuleUsage } from "../e2e/css-rule-coverage-core.mjs";
import { collectCssResourceTimings, summarizeLinkedCssResourceTiming } from "../e2e/css-resource-timing.mjs";
import { summarizeNextJsNavigationJsTiming } from "../e2e/js-resource-timing.mjs";

test("browser timing separates decoded CSS, encoded CSS and navigation transfer", () => {
  const css = ["https://amaanafoundation.org/_next/static/a.css", "https://amaanafoundation.org/_next/static/b.css"];
  const summary = summarizeLinkedCssResourceTiming(css, [
    { name: css[0], decodedBodySize: 600, encodedBodySize: 200, transferSize: 350 },
    { name: css[1], decodedBodySize: 300, encodedBodySize: 100, transferSize: 180 },
  ]);
  assert.equal(summary.metric, "browser-linked-css-resource-timing");
  assert.equal(summary.stylesheetCount, 2);
  assert.equal(summary.decodedBodyBytes, 900);
  assert.equal(summary.encodedBodyBytes, 300);
  assert.equal(summary.transferBytes, 530);
  assert.equal(summary.observedTransferBytes, 530);
  assert.deepEqual(summary.unavailableTransferStylesheets, []);
  assert.match(summary.disclaimer, /not field Web Vitals/i);
});

test("cached CSS makes full transfer unavailable without concealing partial observations", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  const summary = summarizeLinkedCssResourceTiming([a, b, a], [
    { name: a, decodedBodySize: 600, encodedBodySize: 200, transferSize: 0 },
    { name: b, decodedBodySize: 300, encodedBodySize: 100, transferSize: 180 },
    { name: b, decodedBodySize: 300, encodedBodySize: 100, transferSize: 180 },
  ]);
  assert.equal(summary.stylesheetCount, 2);
  assert.equal(summary.decodedBodyBytes, 900);
  assert.equal(summary.encodedBodyBytes, 300);
  assert.equal(summary.transferBytes, null);
  assert.equal(summary.observedTransferBytes, 180);
  assert.deepEqual(summary.unavailableTransferStylesheets, [a]);
});

test("missing and opaque timings never become false zero-byte CSS evidence", () => {
  const missing = "https://amaanafoundation.org/_next/static/missing.css";
  const opaque = "https://amaanafoundation.org/_next/static/opaque.css";
  const summary = summarizeLinkedCssResourceTiming([missing, opaque], [
    { name: opaque, decodedBodySize: 0, encodedBodySize: 0, transferSize: 0 },
  ]);
  assert.equal(summary.decodedBodyBytes, null);
  assert.equal(summary.encodedBodyBytes, null);
  assert.equal(summary.transferBytes, null);
  assert.equal(summary.observedTransferBytes, 0);
  assert.deepEqual(summary.missingTimingStylesheets, [missing]);
  assert.deepEqual(summary.unavailableTransferStylesheets, [missing, opaque]);
  assert.throws(() => summarizeLinkedCssResourceTiming([missing], [{ name: missing, decodedBodySize: -1, encodedBodySize: 1, transferSize: 1 }]), /Invalid browser CSS timing/);
});

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

test("AF-R068 treats CSS URL fragments as one fetched stylesheet, not extra decoded bytes", () => {
  const origin = "http://127.0.0.1:3000";
  const url = origin + "/_next/static/chunks/fragment.css";
  const report = summarizeCssRuleUsage([
    { url: url + "#top", text: "abcd", ranges: [{ start: 0, end: 2 }] },
    { url: url + "#bottom", text: "abcd", ranges: [{ start: 2, end: 4 }] },
  ], origin);
  assert.deepEqual(report.stylesheets, [{ url, totalDecodedBytes: 4, usedDecodedBytes: 4 }]);
  assert.equal(report.measuredTotalDecodedBytes, 4);
  assert.equal(report.measuredUsedDecodedBytes, 4);
  assert.equal(report.sampledUnobservedPercent, 0);

  const queries = summarizeCssRuleUsage([
    { url: url + "?v=1#top", text: "abcd", ranges: [{ start: 0, end: 2 }] },
    { url: url + "?v=2#bottom", text: "abcd", ranges: [{ start: 2, end: 4 }] },
  ], origin);
  assert.deepEqual(queries.stylesheets.map(item => item.url), [
    url + "?v=1", url + "?v=2",
  ], "Distinct requested query variants remain separately measurable");
  assert.equal(queries.measuredTotalDecodedBytes, 8);
});

test("AF-R068 reports sampled unobserved CSS decoded bytes and percent only with complete source text", () => {
  const origin = "http://127.0.0.1:3000";
  const url = origin + "/_next/static/chunks/hero.css";
  const summary = summarizeCssRuleUsage([
    { url, text: "aéb", ranges: [{ start: 0, end: 2 }] },
    { url, text: "aéb", ranges: [{ start: 1, end: 2 }] },
  ], origin);
  assert.equal(summary.measuredTotalDecodedBytes, 4);
  assert.equal(summary.measuredUsedDecodedBytes, 3);
  assert.equal(summary.measuredUnobservedDecodedBytes, 1);
  assert.equal(summary.sampledUnobservedPercent, 25);
  assert.equal(summary.sampledCssTextComplete, true);
});

test("AF-R068 refuses to infer sampled unused percent when one sheet lacks text", () => {
  const origin = "http://127.0.0.1:3000";
  const summary = summarizeCssRuleUsage([
    { url: origin + "/_next/static/chunks/a.css", text: "abcd", ranges: [{ start: 0, end: 2 }] },
    { url: origin + "/_next/static/chunks/b.css", ranges: [] },
  ], origin);
  assert.equal(summary.measuredUnobservedDecodedBytes, 2);
  assert.equal(summary.unmeasuredStylesheets, 1);
  assert.equal(summary.sampledCssTextComplete, false);
  assert.equal(summary.sampledUnobservedPercent, null);
});

test("AF-R068 excluded-only and empty CSS are not measured zero-percent waste", () => {
  const origin = "http://127.0.0.1:3000";
  for (const entries of [
    [],
    [{ url: origin + "/_next/static/chunks/empty.css", text: "", ranges: [] }],
    [{ url: "", text: ".x{}", ranges: [] }],
  ]) {
    const summary = summarizeCssRuleUsage(entries, origin);
    assert.equal(summary.measuredTotalDecodedBytes, 0);
    assert.equal(summary.sampledCssTextComplete, false);
    assert.equal(summary.sampledUnobservedPercent, null);
  }
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

test("AF-R057 excludes HTML comment stylesheet references from measured CSS", () => {
  const actual = '<link rel="stylesheet" href="/_next/static/chunks/current.css">';
  const obsolete = '<link rel="stylesheet" href="/_next/static/chunks/obsolete.css">';
  const expected = ["https://amaanafoundation.org/_next/static/chunks/current.css"];

  assert.deepEqual(stylesheetsInHtml(`<!-- ${obsolete} -->${actual}`), expected);
  // An unterminated comment consumes the remaining document, not a CSS resource.
  assert.deepEqual(stylesheetsInHtml(`${actual}<!-- ${obsolete}`), expected);
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

test("rejects a per-route decoded CSS sum beyond Number.MAX_SAFE_INTEGER", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  assert.throws(() => summarizeRouteCssBytes(
    [{ route: "/", stylesheets: [a, b] }],
    new Map([[a, Number.MAX_SAFE_INTEGER], [b, 1]]),
  ), /CSS route size exceeds safe integer/);
});

test("rejects an aggregate shared CSS sum beyond Number.MAX_SAFE_INTEGER", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  assert.throws(() => summarizeRouteCssBytes(
    [{ route: "/", stylesheets: [a] }, { route: "/impact", stylesheets: [b] }],
    new Map([[a, Number.MAX_SAFE_INTEGER], [b, 1]]),
  ), /CSS shared size exceeds safe integer/);
});

test("allows exact safe-integer CSS totals without double-counting a stylesheet", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  const result = summarizeRouteCssBytes(
    [{ route: "/", stylesheets: [a, b, b] }],
    new Map([[a, Number.MAX_SAFE_INTEGER - 1], [b, 1]]),
  );
  assert.deepEqual(result.routes, [{
    route: "/", stylesheetCount: 2, cssBytes: Number.MAX_SAFE_INTEGER,
  }]);
  assert.deepEqual(result.shared, {
    uniqueStylesheets: 2, decodedCssBytes: Number.MAX_SAFE_INTEGER,
  });
});

test("retains per-stylesheet size validation when totals are guarded", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  for (const invalidSize of [-1, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => summarizeRouteCssBytes(
      [{ route: "/", stylesheets: [a] }], new Map([[a, invalidSize]]),
    ), /Missing CSS size/);
  }
});

test("rejects browser CSS decoded byte totals beyond safe integer precision", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  assert.throws(() => summarizeLinkedCssResourceTiming([a, b], [
    { name: a, decodedBodySize: Number.MAX_SAFE_INTEGER, encodedBodySize: 1, transferSize: 1 },
    { name: b, decodedBodySize: 1, encodedBodySize: 1, transferSize: 1 },
  ]), /Invalid browser CSS decoded total/);
});

test("rejects browser CSS encoded byte totals beyond safe integer precision", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  assert.throws(() => summarizeLinkedCssResourceTiming([a, b], [
    { name: a, decodedBodySize: 1, encodedBodySize: Number.MAX_SAFE_INTEGER, transferSize: 1 },
    { name: b, decodedBodySize: 1, encodedBodySize: 1, transferSize: 1 },
  ]), /Invalid browser CSS encoded total/);
});

test("rejects browser CSS observed transfer byte totals beyond safe integer precision", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  assert.throws(() => summarizeLinkedCssResourceTiming([a, b], [
    { name: a, decodedBodySize: 1, encodedBodySize: 1, transferSize: Number.MAX_SAFE_INTEGER },
    { name: b, decodedBodySize: 1, encodedBodySize: 1, transferSize: 1 },
  ]), /Invalid browser CSS transfer total/);
});

test("preserves safe integer boundary and partial-transfer unavailability", () => {
  const a = "https://amaanafoundation.org/_next/static/a.css";
  const b = "https://amaanafoundation.org/_next/static/b.css";
  const atLimit = summarizeLinkedCssResourceTiming([a, a, b], [
    { name: a, decodedBodySize: Number.MAX_SAFE_INTEGER - 1, encodedBodySize: 20, transferSize: 100 },
    { name: b, decodedBodySize: 1, encodedBodySize: 30, transferSize: 200 },
  ]);
  assert.equal(atLimit.decodedBodyBytes, Number.MAX_SAFE_INTEGER);
  assert.equal(atLimit.encodedBodyBytes, 50);
  assert.equal(atLimit.transferBytes, 300);
  const cached = summarizeLinkedCssResourceTiming([a, b], [
    { name: a, decodedBodySize: 200, encodedBodySize: 100, transferSize: 0 },
    { name: b, decodedBodySize: 300, encodedBodySize: 130, transferSize: 90 },
  ]);
  assert.equal(cached.transferBytes, null);
  assert.equal(cached.observedTransferBytes, 90);
  assert.deepEqual(cached.unavailableTransferStylesheets, [a]);
});

test("counts query-specific CSS resources separately without fetching URL fragments", () => {
  const html = [
    '<link rel="stylesheet" href="/_next/static/chunks/app.css?v=one">',
    '<link href="/_next/static/chunks/app.css?v=two#view" rel="stylesheet">',
    '<link href="/_next/static/chunks/app.css?v=one#duplicate" rel="stylesheet">',
    '<link href="https://external.invalid/_next/static/chunks/app.css?v=other" rel="stylesheet">',
  ].join("");
  assert.deepEqual(stylesheetsInHtml(html), [
    "https://amaanafoundation.org/_next/static/chunks/app.css?v=one",
    "https://amaanafoundation.org/_next/static/chunks/app.css?v=two",
  ]);
});

test("measures distinct same-path CSS query variants at their actual URLs", async () => {
  const cssOne = "https://amaanafoundation.org/_next/static/site.css?v=one";
  const cssTwo = "https://amaanafoundation.org/_next/static/site.css?v=two";
  const html = '<link rel="stylesheet" href="/_next/static/site.css?v=one">'
    + '<link rel="stylesheet" href="/_next/static/site.css?v=two">';
  const seen = [];
  const responses = new Map([
    ["https://amaanafoundation.org/", { body: html, type: "text/html" }],
    [cssOne, { body: "a{color:red}", type: "text/css" }],
    [cssTwo, { body: "b{color:blue}", type: "text/css" }],
  ]);
  const fetchImpl = async (url, options) => {
    seen.push(url);
    assert.equal(options.redirect, "manual");
    const response = responses.get(url);
    if (!response) throw new Error("Unexpected stylesheet request: " + url);
    return {
      ok: true, status: 200, url,
      headers: { get: () => response.type },
      text: async () => response.body,
      arrayBuffer: async () => new TextEncoder().encode(response.body).buffer,
    };
  };
  const report = await auditPublicRouteCss({ fetchImpl, routes: ["/"] });
  assert.equal(report.routes[0].stylesheetCount, 2);
  assert.equal(report.routes[0].cssBytes, 25);
  assert.deepEqual(seen, ["https://amaanafoundation.org/", cssOne, cssTwo]);
});


const jsBase = "https://amaanafoundation.org/our-work";
const jsA = "https://amaanafoundation.org/_next/static/chunks/a.js";
const jsB = "https://amaanafoundation.org/_next/static/chunks/app/b.js";
const jsTiming = (name, decodedBodySize, encodedBodySize, transferSize) => ({ name, decodedBodySize, encodedBodySize, transferSize });

test("browser JS timing separates linked/dynamic decoded, encoded and transferred bytes", () => {
  const summary = summarizeNextJsNavigationJsTiming([jsA], [
    jsTiming(jsA, 900, 300, 410), jsTiming(jsB, 400, 200, 250),
  ], jsBase);
  assert.equal(summary.metric, "browser-nextjs-navigation-js-resource-timing");
  assert.equal(summary.scriptCount, 2);
  assert.equal(summary.requestCount, 2);
  assert.equal(summary.decodedBodyBytes, 1300);
  assert.equal(summary.encodedBodyBytes, 500);
  assert.equal(summary.transferBytes, 660);
  assert.equal(summary.observedTransferBytes, 660);
  assert.deepEqual(summary.missingTimingScripts, []);
  assert.deepEqual(summary.unavailableTransferScripts, []);
  assert.match(summary.disclaimer, /not field Web Vitals/i);
});

test("browser JS cache makes complete transfer unavailable without concealing partial observations", () => {
  const summary = summarizeNextJsNavigationJsTiming([jsA, jsB], [
    jsTiming(jsA, 600, 250, 0), jsTiming(jsB, 300, 130, 180),
  ], jsBase);
  assert.equal(summary.decodedBodyBytes, 900);
  assert.equal(summary.encodedBodyBytes, 380);
  assert.equal(summary.transferBytes, null);
  assert.equal(summary.observedTransferBytes, 180);
  assert.deepEqual(summary.unavailableTransferScripts, [jsA]);
});

test("browser JS missing or opaque timing never becomes false zero bytes", () => {
  const summary = summarizeNextJsNavigationJsTiming([jsA, jsB], [jsTiming(jsA, 0, 0, 0)], jsBase);
  assert.equal(summary.decodedBodyBytes, null);
  assert.equal(summary.encodedBodyBytes, null);
  assert.equal(summary.transferBytes, null);
  assert.deepEqual(summary.missingTimingScripts, [jsB]);
  assert.deepEqual(summary.unavailableTransferScripts, [jsA, jsB]);
});

test("browser JS reports repeated downloads separately but not repeated script tags", () => {
  const summary = summarizeNextJsNavigationJsTiming([jsA, jsA], [
    jsTiming(jsA, 600, 200, 250), jsTiming(jsA, 600, 200, 250),
  ], jsBase);
  assert.equal(summary.scriptCount, 1);
  assert.equal(summary.requestCount, 2);
  assert.equal(summary.transferBytes, 500);
});

test("browser JS excludes foreign and unrelated non-Next assets", () => {
  const foreign = "https://cdn.example.org/_next/static/chunks/foreign.js";
  const unrelated = "https://amaanafoundation.org/api/metrics.js";
  const summary = summarizeNextJsNavigationJsTiming([foreign, unrelated, "/_next/static/chunks/a.js"], [
    jsTiming(foreign, 9000, 9000, 9000), jsTiming(unrelated, 8000, 8000, 8000),
    jsTiming(jsA, 100, 50, 70),
  ], jsBase);
  assert.equal(summary.scriptCount, 1);
  assert.equal(summary.decodedBodyBytes, 100);
  assert.equal(summary.transferBytes, 70);
});

test("browser JS rejects invalid sizes, unsafe totals and invalid navigation inputs", () => {
  assert.throws(() => summarizeNextJsNavigationJsTiming([jsA], [jsTiming(jsA, -1, 1, 1)], jsBase), /Invalid browser JavaScript timing/);
  assert.throws(() => summarizeNextJsNavigationJsTiming([jsA], [jsTiming(jsA, NaN, 1, 1)], jsBase), /Invalid browser JavaScript timing/);
  assert.throws(() => summarizeNextJsNavigationJsTiming([jsA], [jsTiming(jsA, 1.1, 1, 1)], jsBase), /Invalid browser JavaScript timing/);
  assert.throws(() => summarizeNextJsNavigationJsTiming([jsA], [
    jsTiming(jsA, Number.MAX_SAFE_INTEGER, 1, 1), jsTiming(jsA, 1, 1, 1),
  ], jsBase), /Invalid browser JavaScript decoded total/);
  assert.throws(() => summarizeNextJsNavigationJsTiming([], [], "data:text/plain,test"), /Invalid navigation URL/);
  assert.throws(() => summarizeNextJsNavigationJsTiming(null, [], jsBase), /arrays/);
  assert.throws(() => summarizeNextJsNavigationJsTiming([], [{ name: 7 }], jsBase), /Invalid browser JavaScript timing entry/);
});


test("AF-R057 does not count stylesheet-shaped strings in script raw text", () => {
  const genuine = '<link rel="stylesheet" href="/_next/static/chunks/genuine.css">';
  const scriptValue = "<link rel='stylesheet' href='/_next/static/chunks/inert.js-string.css'>";
  const expected = ["https://amaanafoundation.org/_next/static/chunks/genuine.css"];
  assert.deepEqual(stylesheetsInHtml(`<script>const note = ${JSON.stringify(scriptValue)};</script>${genuine}`), expected);
  // With no closing script tag, the remaining HTML is script text, not a CSS resource.
  assert.deepEqual(stylesheetsInHtml(`${genuine}<script>const note = ${JSON.stringify(scriptValue)};`), expected);
});

for (const element of ["style", "title", "textarea", "xmp", "noembed", "noframes"]) {
  test(`AF-R057 excludes stylesheet-shaped ${element} text and resumes after its closing tag`, () => {
    const fake = '<link rel="stylesheet" href="/_next/static/inert.css">';
    const real = '<link rel="stylesheet" href="/_next/static/real.css">';
    const expected = ["https://amaanafoundation.org/_next/static/real.css"];
    assert.deepEqual(stylesheetsInHtml(`<${element}>${fake}</${element}>${real}`), expected);
    assert.deepEqual(stylesheetsInHtml(`${real}<${element}>${fake}`), expected);
    assert.deepEqual(stylesheetsInHtml(`<${element.toUpperCase()}>${fake}</${element.toUpperCase()}>${real}`), expected);
  });
}

test("AF-R057 preserves active stylesheets inside custom elements with raw-text prefixes", () => {
  for (const element of ["script-note", "style-panel", "title-card", "textarea-field", "xmp-view", "noembed-box", "noframes-box"]) {
    assert.deepEqual(stylesheetsInHtml(`<${element}><link rel="stylesheet" href="/_next/static/real.css"></${element}>`),
      ["https://amaanafoundation.org/_next/static/real.css"], element);
  }
});

test("AF-R057 ignores href-shaped text inside an unrelated quoted attribute", () => {
  assert.deepEqual(stylesheetsInHtml(`<link data-note=" href='/_next/static/fake.css' " rel="stylesheet">`), []);
});
test("AF-R057 ignores rel-shaped text inside an unrelated quoted attribute", () => {
  assert.deepEqual(stylesheetsInHtml(`<link data-note=" rel='stylesheet' " href="/_next/static/fake.css">`), []);
});
test("AF-R057 preserves a real stylesheet after a quoted greater-than delimiter", () => {
  assert.deepEqual(stylesheetsInHtml('<link data-note="a > b" rel="stylesheet" href="/_next/static/real.css">'),
    ["https://amaanafoundation.org/_next/static/real.css"]);
});
test("AF-R057 ignores link-shaped markup inside another tag attribute", () => {
  assert.deepEqual(stylesheetsInHtml(`<div data-note="<link rel='stylesheet' href='/_next/static/fake.css'>"></div>`), []);
});
test("AF-R057 ignores custom elements whose name starts with link", () => {
  assert.deepEqual(stylesheetsInHtml('<link-card rel="stylesheet" href="/_next/static/fake.css"></link-card>'), []);
});

for (const [label, sources, names, count, requests] of [
  ["source fragment", [jsA + "#module"], [jsA], 1, 1],
  ["fragment aliases", [jsA + "#one", jsA + "#two"], [jsA], 1, 1],
  ["timing fragment", [jsA], [jsA + "#module"], 1, 1],
  ["query and fragment", [jsA + "?v=1#module"], [jsA + "?v=1"], 1, 1],
  ["distinct queries", [jsA + "?v=1#one", jsA + "?v=2#two"], [jsA + "?v=1", jsA + "?v=2"], 2, 2],
  ["repeated requests", [jsA + "#one", jsA + "#two"], [jsA, jsA], 1, 2],
]) {
  test(`AF-R047 browser JS request identity excludes fragments: ${label}`, () => {
    const result = summarizeNextJsNavigationJsTiming(sources, names.map(name => jsTiming(name, 100, 50, 60)), jsBase);
    assert.equal(result.scriptCount, count);
    assert.equal(result.requestCount, requests);
    assert.equal(result.decodedBodyBytes, requests * 100);
    assert.equal(result.encodedBodyBytes, requests * 50);
    assert.equal(result.transferBytes, requests * 60);
    assert.deepEqual(result.missingTimingScripts, []);
    assert.deepEqual(result.unavailableTransferScripts, []);
  });
}

const cssRequest = "https://amaanafoundation.org/_next/static/chunks/fragment.css";
for (const [label, hrefs, names, count] of [
  ["href fragment", [cssRequest + "#one"], [cssRequest], 1],
  ["fragment aliases", [cssRequest + "#one", cssRequest + "#two"], [cssRequest], 1],
  ["timing fragment", [cssRequest], [cssRequest + "#one"], 1],
  ["distinct queries", [cssRequest + "?v=1#one", cssRequest + "?v=2#two"], [cssRequest + "?v=1", cssRequest + "?v=2"], 2],
  ["same query aliases", [cssRequest + "?v=1#one", cssRequest + "?v=1#two"], [cssRequest + "?v=1"], 1],
]) {
  test(`browser CSS timing matches fragment-free requests: ${label}`, () => {
    const result = summarizeLinkedCssResourceTiming(hrefs, names.map(name => ({ name, decodedBodySize: 100, encodedBodySize: 50, transferSize: 60 })));
    assert.equal(result.stylesheetCount, count);
    assert.equal(result.decodedBodyBytes, count * 100);
    assert.equal(result.encodedBodyBytes, count * 50);
    assert.equal(result.transferBytes, count * 60);
    assert.deepEqual(result.missingTimingStylesheets, []);
    assert.deepEqual(result.unavailableTransferStylesheets, []);
  });
}

test("browser CSS timing rejects a fragment without a resource URL", () => {
  assert.throws(() => summarizeLinkedCssResourceTiming(["#fragment"], []), /Browser CSS links must be nonempty URLs/);
});

test("browser CSS snapshot retains fragment-free timing until normalized link matching", t => {
  t.mock.method(performance, "getEntriesByType", type => {
    assert.equal(type, "resource");
    return [
      { name: cssRequest, decodedBodySize: 100, encodedBodySize: 50, transferSize: 60 },
      { name: "https://amaanafoundation.org/image.png", decodedBodySize: 9000, encodedBodySize: 8000, transferSize: 8100 },
    ];
  });
  const result = summarizeLinkedCssResourceTiming([cssRequest + "#one"], collectCssResourceTimings());
  assert.equal(result.stylesheetCount, 1);
  assert.equal(result.decodedBodyBytes, 100);
  assert.equal(result.transferBytes, 60);
  assert.deepEqual(result.missingTimingStylesheets, []);
});


test("AF-R057 excludes inert template stylesheet links, including nested and unterminated templates", () => {
  const fake = '<link rel="stylesheet" href="/_next/static/fake.css">';
  const other = '<link rel="stylesheet" href="/_next/static/other.css">';
  const real = '<link rel="stylesheet" href="/_next/static/real.css">';
  const expected = ["https://amaanafoundation.org/_next/static/real.css"];
  assert.deepEqual(stylesheetsInHtml(`<template>${fake}</template>${real}`), expected);
  assert.deepEqual(stylesheetsInHtml(`<template data-note="a > b"><template>${fake}</template>${other}</template>${real}`), expected);
  assert.deepEqual(stylesheetsInHtml(`${real}<template>${fake}`), expected,
    "An unclosed template must not publish inactive stylesheet references");
  assert.deepEqual(stylesheetsInHtml(`<div data-note="<template>${fake}</template>"></div>${real}`), expected,
    "Tag-shaped quoted attributes must not hide active stylesheets");
  assert.deepEqual(stylesheetsInHtml(`<template-card>${real}</template-card>`), expected,
    "Template-like custom element names are active containers");
});

test("AF-R057 excludes noscript fallback stylesheets from a JS-enabled CSS audit", () => {
  const fake = '<link rel="stylesheet" href="/_next/static/no-js.css">';
  const real = '<link rel="stylesheet" href="/_next/static/real.css">';
  assert.deepEqual(stylesheetsInHtml(`<noscript>${fake}</noscript>${real}`),
    ["https://amaanafoundation.org/_next/static/real.css"]);
});
