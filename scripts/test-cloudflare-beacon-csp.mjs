import assert from "node:assert/strict";
import test from "node:test";
import config from "../next.config.ts";
import { auditCloudflareBeaconCsp } from "./cloudflare-beacon-csp.mjs";

async function configuredCsp() {
  const headers = await config.headers();
  const global = headers.find(entry => entry.source === "/(.*)");
  const csp = global?.headers.find(entry => entry.key.toLowerCase() === "content-security-policy")?.value;
  assert.ok(csp, "Expected enforced global CSP");
  return csp;
}

test("AF-R015 keeps Cloudflare beacon origins out of enforced CSP without breaking Razorpay", async () => {
  assert.deepEqual(auditCloudflareBeaconCsp(await configuredCsp()), []);
});

test("AF-R015 fails on injected Cloudflare script and connect endpoints", async () => {
  const csp = await configuredCsp();
  const script = csp.replace("https://checkout.razorpay.com;", "https://checkout.razorpay.com https://static.cloudflareinsights.com;");
  const connect = csp.replace("https://api.razorpay.com;", "https://api.razorpay.com https://cloudflareinsights.com;");
  assert.notEqual(script, csp);
  assert.notEqual(connect, csp);
  assert.match(auditCloudflareBeaconCsp(script).join(" "), /unapproved script origin/i);
  assert.match(auditCloudflareBeaconCsp(connect).join(" "), /unapproved connect origin/i);
});

test("AF-R015 denies wildcard sources and disappearing checkout transports", async () => {
  const csp = await configuredCsp();
  for (const changed of [
    csp.replace("script-src 'self'", "script-src * 'self'"),
    csp.replace("connect-src 'self'", "connect-src * 'self'"),
    csp.replace("https://checkout.razorpay.com;", ";"),
    csp.replace("https://api.razorpay.com;", ";"),
  ]) {
    assert.notEqual(changed, csp);
    assert.notDeepEqual(auditCloudflareBeaconCsp(changed), []);
  }
});

test("AF-R015 rejects duplicated or missing CSP directives without echoing their contents", async () => {
  const csp = await configuredCsp();
  assert.match(auditCloudflareBeaconCsp(csp + "; script-src https://static.cloudflareinsights.com").join(" "), /duplicate/i);
  assert.match(auditCloudflareBeaconCsp("default-src 'self'").join(" "), /required/i);
  assert.match(auditCloudflareBeaconCsp(null).join(" "), /required/i);
});
