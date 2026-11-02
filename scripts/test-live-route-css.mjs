import assert from "node:assert/strict";
import { test } from "node:test";
import { stylesheetsInHtml, summarizeRouteCssBytes, auditPublicRouteCss } from "./audit-live-route-css.mjs";
import { summarizeLinkedCssResourceTiming } from "../e2e/css-resource-timing.mjs";

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
