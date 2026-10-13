import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";

const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");

test("CSP keeps essential browser isolation directives", () => {
  for (const directive of [
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "script-src-attr 'none'",
    "form-action 'self'",
  ]) {
    assert.ok(config.includes(directive), `Missing protective CSP directive: ${directive}`);
  }
});

test("CSP only enables eval for local development and scopes payment origins", () => {
  assert.match(config, /process\.env\.NODE_ENV === "development" \? " 'unsafe-eval'" : ""/);
  assert.match(config, /script-src 'self' 'unsafe-inline'\$\{devEval\} https:\/\/checkout\.razorpay\.com/);
  assert.match(config, /connect-src 'self' https:\/\/api\.razorpay\.com/);
  assert.match(config, /frame-src https:\/\/api\.razorpay\.com https:\/\/checkout\.razorpay\.com/);
});

test("donation, admin, and assistance responses retain no-store headers", () => {
  assert.match(config, /const noStoreHeaders = \[\{ key: "Cache-Control", value: "private, no-store, max-age=0" \}\]/);
  for (const route of ["/api/:path*", "/admin/:path*", "/donate/:path*", "/donations/:path*", "/request-assistance/:path*"]) {
    assert.ok(config.includes(`{ source: "${route}", headers: noStoreHeaders }`), `Unprotected route: ${route}`);
  }
});
