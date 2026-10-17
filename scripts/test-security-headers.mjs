import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";

function headersFor(env = {}) {
  // Evaluate the real config independently; comments cannot satisfy these checks.
  const url = new URL("../next.config.ts", import.meta.url).href;
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "-e",
    `const { default: config } = await import(${JSON.stringify(url)}); console.log(JSON.stringify(await config.headers()));`,
  ], {
    encoding: "utf8", timeout: 10_000,
    env: { ...process.env, NODE_ENV: "production", NEXT_PUBLIC_ALLOW_INDEXING: "true",
      AMAANA_BROWSER_ACCEPTANCE: "false", NEXT_PUBLIC_APP_URL: "https://amaanafoundation.org",
      PUBLIC_MEDIA_BASE_URL: "", NEXT_PUBLIC_DONATION_UPI_QR_URL: "", AMAANA_CSP_REPORT_ONLY: "false", ...env },
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function policy(rows, source) {
  const row = rows.find(row => row.source === source);
  assert.ok(row, `Missing header matcher: ${source}`);
  return Object.fromEntries(row.headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

function directives(value) {
  return new Map(value.split(";").map(item => {
    const [name, ...tokens] = item.trim().split(/\s+/);
    return [name, tokens];
  }));
}

test("generated production CSP retains isolation and scoped payment sources", () => {
  const csp = directives(policy(headersFor(), "/(.*)")["content-security-policy"]);
  for (const name of ["object-src", "frame-ancestors", "script-src-attr"]) assert.deepEqual(csp.get(name), ["'none'"]);
  for (const name of ["base-uri", "form-action"]) assert.deepEqual(csp.get(name), ["'self'"]);
  assert.deepEqual(csp.get("script-src"), ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com"]);
  assert.deepEqual(csp.get("connect-src"), ["'self'", "https://api.razorpay.com"]);
  assert.deepEqual(csp.get("frame-src"), ["https://api.razorpay.com", "https://checkout.razorpay.com"]);
  assert.ok(csp.has("upgrade-insecure-requests"));
});

test("eval is development-only; local browser acceptance can omit HTTPS upgrade", () => {
  const dev = directives(policy(headersFor({ NODE_ENV: "development" }), "/(.*)")["content-security-policy"]);
  assert.ok(dev.get("script-src").includes("'unsafe-eval'"));
  const local = directives(policy(headersFor({ AMAANA_BROWSER_ACCEPTANCE: "true" }), "/(.*)")["content-security-policy"]);
  assert.ok(!local.has("upgrade-insecure-requests"));
  assert.ok(!local.get("script-src").includes("'unsafe-eval'"));
});

for (const indexing of ["true", "false"]) {
  test(`private headers override public policy with indexing=${indexing}`, () => {
    const rows = headersFor({ NEXT_PUBLIC_ALLOW_INDEXING: indexing });
    const global = policy(rows, "/(.*)");
    assert.equal(global["referrer-policy"], "strict-origin-when-cross-origin");
    assert.equal(global["x-robots-tag"], indexing === "true" ? undefined : "noindex, nofollow, noarchive");
    for (const source of ["/api/:path*", "/admin/:path*", "/donations/:path*", "/request-assistance/received", "/request-assistance/status"]) {
      assert.ok(rows.findIndex(row => row.source === source) > rows.findIndex(row => row.source === "/(.*)"));
      const privatePolicy = { ...global, ...policy(rows, source) };
      assert.equal(privatePolicy["cache-control"], "private, no-store, max-age=0");
      assert.equal(privatePolicy["referrer-policy"], "no-referrer");
      assert.equal(privatePolicy["x-robots-tag"], "noindex, nofollow, noarchive");
    }
    for (const source of ["/donate/:path*", "/request-assistance/:path*"]) {
      const landingPolicy = { ...global, ...policy(rows, source) };
      assert.equal(landingPolicy["cache-control"], "private, no-store, max-age=0");
      assert.equal(landingPolicy["referrer-policy"], "no-referrer");
      assert.equal(landingPolicy["x-robots-tag"], global["x-robots-tag"]);
    }
  });
}

test("CSP admits configured HTTPS image origins without credentials", () => {
  const rows = headersFor({ PUBLIC_MEDIA_BASE_URL: "https://photos.example.test/public/",
    NEXT_PUBLIC_DONATION_UPI_QR_URL: "https://user:password@untrusted.example.test/qr.png" });
  const csp = directives(policy(rows, "/(.*)")["content-security-policy"]);
  assert.deepEqual(csp.get("img-src"), ["'self'", "blob:", "data:", "https://amaanafoundation.org", "https://photos.example.test"]);
});


test("strict-script diagnostics are opt-in and never change the enforced payment CSP", () => {
  const disabled = policy(headersFor(), "/(.*)");
  assert.equal(disabled["content-security-policy-report-only"], undefined);
  assert.equal(disabled["reporting-endpoints"], undefined);
  const enabled = policy(headersFor({ AMAANA_CSP_REPORT_ONLY: "true" }), "/(.*)");
  assert.equal(enabled["content-security-policy"], disabled["content-security-policy"]);
  const reportOnly = directives(enabled["content-security-policy-report-only"]);
  assert.deepEqual(reportOnly.get("script-src"), ["'self'", "https://checkout.razorpay.com"]);
  assert.deepEqual(reportOnly.get("script-src-attr"), ["'none'"]);
  assert.deepEqual(reportOnly.get("report-uri"), ["/api/security/csp-report"]);
  assert.deepEqual(reportOnly.get("report-to"), ["amaana-csp"]);
  assert.equal(enabled["reporting-endpoints"], 'amaana-csp="/api/security/csp-report"');
  assert.ok(!enabled["content-security-policy-report-only"].includes("report-sample"));
  const local = directives(policy(headersFor({ AMAANA_CSP_REPORT_ONLY: "true", AMAANA_BROWSER_ACCEPTANCE: "true" }), "/(.*)")["content-security-policy-report-only"]);
  assert.ok(!local.has("report-to"));
  assert.deepEqual(local.get("script-src"), reportOnly.get("script-src"));
});
