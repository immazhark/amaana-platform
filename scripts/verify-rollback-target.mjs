import assert from "node:assert/strict";

const rawBaseUrl = process.env.STAGING_BASE_URL?.trim();
const expectedSha = process.env.EXPECTED_COMMIT_SHA?.trim();

if (!rawBaseUrl) throw new Error("STAGING_BASE_URL is required");
if (!expectedSha) throw new Error("EXPECTED_COMMIT_SHA is required");

const baseUrl = new URL(rawBaseUrl);
const productionHosts = new Set(["amaanafoundation.org", "www.amaanafoundation.org"]);
if (productionHosts.has(baseUrl.hostname.toLowerCase())) {
  throw new Error("Rollback rehearsal verifier refuses the production Amaana hostname");
}

async function get(path, init) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "manual",
    headers: {
      "user-agent": "Amaana-Rollback-Rehearsal/1.0",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  return response;
}

function pass(label) {
  console.log(`✓ ${label}`);
}

const version = await get("/api/health/version");
assert.equal(version.status, 200, "version endpoint is not healthy");
const versionBody = await version.json();
assert.equal(versionBody.commitSha, expectedSha, "deployed commit SHA does not match expected rollback target");
assert.equal(versionBody.environment, "staging", "rollback rehearsal target must report APP_ENVIRONMENT=staging");
assert.equal(versionBody.paymentMode, "test", "rollback rehearsal target must report Razorpay Test mode");
assert.match(version.headers.get("cache-control") ?? "", /no-store/i, "version endpoint must be no-store");
pass(`exact deployed SHA ${expectedSha}`);
pass("staging environment posture");
pass("Razorpay Test payment posture");

const live = await get("/api/health/live");
assert.equal(live.status, 200, "liveness endpoint failed");
assert.match(live.headers.get("cache-control") ?? "", /no-store/i, "liveness endpoint must be no-store");
pass("liveness");

const ready = await get("/api/health/ready");
assert.equal(ready.status, 200, "readiness endpoint failed");
const readyBody = await ready.json();
assert.equal(readyBody.status, "ready", "readiness endpoint did not report ready");
assert.match(ready.headers.get("cache-control") ?? "", /no-store/i, "readiness endpoint must be no-store");
pass("database-backed readiness");

for (const path of ["/", "/about", "/our-work", "/appeals", "/donate", "/request-assistance"]) {
  const response = await get(path);
  assert.equal(response.status, 200, `${path} did not return 200`);
  const html = await response.text();
  assert.match(html, /Amaana/i, `${path} did not render Amaana content`);
  pass(`public route ${path}`);
}

const robots = await get("/robots.txt");
assert.equal(robots.status, 200, "robots.txt failed");
const robotsBody = await robots.text();
assert.match(robotsBody, /Disallow:\s*\//i, "staging robots.txt must remain fail-closed during rollback rehearsal");
pass("staging robots remains fail-closed");

const privateAck = await get("/api/donations/acknowledgement", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: baseUrl.origin,
  },
  body: JSON.stringify({ reference: "invalid-reference", token: "invalid-token-at-least-twenty-chars" }),
});
assert.ok([403, 404].includes(privateAck.status), "private acknowledgement probe did not fail closed");
assert.match(privateAck.headers.get("cache-control") ?? "", /no-store/i, "private acknowledgement must be no-store");
assert.equal(privateAck.headers.get("referrer-policy"), "no-referrer", "private acknowledgement must suppress referrers");
assert.match(privateAck.headers.get("x-robots-tag") ?? "", /noindex/i, "private acknowledgement must remain noindex");
pass("private donation acknowledgement boundary");

const assistanceStatus = await get("/api/assistance/status", {
  method: "POST",
  headers: {
    "content-type": "application/json",
    origin: baseUrl.origin,
  },
  body: JSON.stringify({ reference: "invalid", token: "invalid-token-at-least-twenty-chars" }),
});
assert.ok([200, 403].includes(assistanceStatus.status), "assistance tracking boundary returned an unexpected status");
assert.match(assistanceStatus.headers.get("cache-control") ?? "", /no-store/i, "assistance tracking must be no-store");
assert.equal(assistanceStatus.headers.get("referrer-policy"), "no-referrer", "assistance tracking must suppress referrers");
assert.match(assistanceStatus.headers.get("x-robots-tag") ?? "", /noindex/i, "assistance tracking must remain noindex");
pass("private assistance tracking boundary");

console.log("Amaana rollback rehearsal verification passed.");
