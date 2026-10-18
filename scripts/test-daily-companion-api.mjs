import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as helpers from "../src/lib/daily-companion.ts";

// Load the shared streaming implementation via TypeScript transpilation. The
// pinned Node strip-types runner does not support parameter properties in its
// error classes; the existing companion route is transpiled for this reason.
const boundedSource = readFileSync(new URL("../src/lib/bounded-request-body.ts", import.meta.url), "utf8");
const boundedCompiled = ts.transpileModule(boundedSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const boundedExports = {};
runInNewContext(boundedCompiled, {
  exports: boundedExports, TextDecoder, Uint8Array, setTimeout, clearTimeout,
});
const { readTextBodyWithLimit } = boundedExports;


const source = readFileSync(new URL("../src/app/api/public/islamic-companion/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
const validData = date => ({ code: 200, data: { date: { gregorian: { date } }, meta: { timezone: "Asia/Kolkata" }, timings: { Fajr: "04:51", Sunrise: "06:04", Dhuhr: "12:12", Asr: "16:36", Maghrib: "18:20", Isha: "19:33" } } });

function handler(fetchImpl) {
  const exports = {};
  class FixedDate extends Date { constructor(value = "2026-09-13T12:00:00Z") { super(value); } }
  runInNewContext(compiled, {
    exports, Date: FixedDate, URL, URLSearchParams, AbortSignal, fetch: fetchImpl,
    require: name => {
      if (name === "next/server") return { NextResponse: { json: (body, init = {}) => ({ body, status: init.status ?? 200, headers: init.headers ?? {} }) } };
      if (name === "@/lib/daily-companion") return helpers;
      if (name === "@/lib/bounded-request-body") return { readTextBodyWithLimit };
      if (name === "@/data/hyderabad-moonsighting.json") return { announcements: [] };
      throw new Error(`Unexpected dependency ${name}`);
    },
  });
  return exports.GET;
}
const request = query => ({ url: `https://example.com/api/public/islamic-companion${query}` });
const response = body => new Response(JSON.stringify(body), {
  status: 200,
  headers: { "content-type": "application/json" },
});

test("invalid calculation and coordinates are rejected before upstream access", async () => {
  const get = handler(() => { throw new Error("Must not fetch"); });
  for (const query of ["?school=99", "?lat=17&lon=78"]) assert.equal((await get(request(query))).status, 400);
});
test("today and tomorrow use Hyderabad date and fixed city coordinates", async () => {
  const urls = [];
  const get = handler(async (value, init) => {
    assert.equal(init.redirect, "error");
    const url = new URL(value); urls.push(url);
    return response(validData(url.pathname.split("/").at(-1)));
  });
  const result = await get(request("?school=0"));
  assert.equal(result.status, 200);
  assert.equal(result.body.today.date, "2026-09-13");
  assert.equal(result.body.tomorrow.date, "2026-09-14");
  assert.equal(result.body.moon, null);
  assert.equal(result.body.eveningMoon, null);
  assert.equal(urls.length, 2);
  for (const url of urls) {
    assert.equal(url.searchParams.get("latitude"), "17.3850");
    assert.equal(url.searchParams.get("longitude"), "78.4867");
    assert.equal(url.searchParams.get("school"), "0");
    assert.equal(url.searchParams.get("timezonestring"), "Asia/Kolkata");
  }
});
test("oversized declared prayer-provider responses never become published prayer times", async () => {
  const get = handler(async url => {
    const date = new URL(url).pathname.split("/").at(-1);
    const body = JSON.stringify(validData(date));
    return new Response(body, {
      status: 200,
      headers: { "content-type": "application/json", "content-length": "100000" },
    });
  });
  const result = await get(request(""));
  assert.equal(result.status, 503);
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.equal(result.body.today, undefined);
});

test("chunked oversized prayer-provider replies fail closed without Content-Length", async () => {
  const get = handler(async url => {
    const date = new URL(url).pathname.split("/").at(-1);
    const data = { ...validData(date), extra: "x".repeat(70_000) };
    return response(data);
  });
  const result = await get(request(""));
  assert.equal(result.status, 503);
  assert.equal(result.body.today, undefined);
});

test("oversized tomorrow response preserves verified today without inventing tomorrow", async () => {
  const get = handler(async url => {
    const date = new URL(url).pathname.split("/").at(-1);
    const data = validData(date);
    if (date === "14-09-2026") return response({ ...data, extra: "x".repeat(70_000) });
    return response(data);
  });
  const result = await get(request(""));
  assert.equal(result.status, 200);
  assert.equal(result.body.today.date, "2026-09-13");
  assert.equal(result.body.today.timings.Fajr, "04:51");
  assert.equal(result.body.tomorrow, null);
});

test("provider outage yields an actionable no-store error, not fake timings", async () => {
  const get = handler(async () => { throw new Error("Offline"); });
  const result = await get(request(""));
  assert.equal(result.status, 503);
  assert.equal(result.headers["Cache-Control"], "no-store");
  assert.ok(result.body.error.includes("masjid"));
  assert.equal(result.body.today, undefined);
});
test("tomorrow outage preserves valid today without reusing today's Fajr", async () => {
  const get = handler(async url => {
    if (url.includes("14-09-2026")) throw new Error("Tomorrow missing");
    return response(validData("13-09-2026"));
  });
  const result = await get(request(""));
  assert.equal(result.status, 200);
  assert.equal(result.body.tomorrow, null);
  assert.equal(result.body.today.timings.Fajr, "04:51");
});
test("wrong day, wrong timezone and malformed times fail closed", async () => {
  for (const mutate of [
    data => { data.data.date.gregorian.date = "12-09-2026"; },
    data => { data.data.meta.timezone = "Asia/Karachi"; },
    data => { data.data.timings.Asr = "25:99"; },
    data => { delete data.data.timings.Fajr; },
    data => { data.code = 500; },
  ]) {
    const get = handler(async () => { const data = validData("13-09-2026"); mutate(data); return response(data); });
    assert.equal((await get(request(""))).status, 503);
  }
});
