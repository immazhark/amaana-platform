import assert from "node:assert/strict";
import { test } from "node:test";
import { stylesheetsInHtml, summarizeRouteCssBytes, auditPublicRouteCss } from "./audit-live-route-css.mjs";

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
