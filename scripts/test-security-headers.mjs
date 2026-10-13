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

test("effective Next.js header mapping preserves sensitive route cache isolation", async () => {
  const { default: nextConfig } = await import("../next.config.ts");
  const rules = await nextConfig.headers();
  const resolveHeader = (pathname, key) => {
    const matched = rules.filter(rule => {
      if (rule.source === "/(.*)") return true;
      if (rule.source.endsWith("/:path*")) {
        const prefix = rule.source.slice(0, -"/:path*".length);
        return pathname === prefix || pathname.startsWith(prefix + "/");
      }
      return pathname === rule.source;
    });
    return matched.flatMap(rule => rule.headers).filter(header => header.key === key).at(-1)?.value;
  };
  for (const pathname of ["/api/donations", "/admin", "/donate", "/donations/receipt", "/request-assistance"]) {
    assert.equal(resolveHeader(pathname, "Cache-Control"), "private, no-store, max-age=0", pathname);
  }
  const csp = resolveHeader("/donate", "Content-Security-Policy");
  assert.ok(csp);
  for (const directive of ["object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
    assert.ok(csp.includes(directive), directive);
  }
});
