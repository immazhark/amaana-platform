import assert from "node:assert/strict";

const rawBaseUrl = process.env.STAGING_BASE_URL;
if (!rawBaseUrl) {
  throw new Error("STAGING_BASE_URL is required, for example https://<staging-host>");
}

const expectedCommitSha = process.env.EXPECTED_COMMIT_SHA?.trim() || null;
const baseUrl = new URL(rawBaseUrl);
const configuredRequestOrigin = process.env.STAGING_REQUEST_ORIGIN?.trim()
  || process.env.NEXT_PUBLIC_APP_URL?.trim()
  || null;
const requestOrigin = configuredRequestOrigin
  ? new URL(configuredRequestOrigin).origin
  : baseUrl.origin;
const productionHosts = new Set(["amaanafoundation.org", "www.amaanafoundation.org"]);
if (productionHosts.has(baseUrl.hostname)) {
  throw new Error("Refusing to run staging acceptance checks against the production Amaana domain");
}

const syntheticSlug = "staging-checkout-acceptance";
const syntheticDonationReference = "AFD-STAGING-REFUNDED";
const syntheticDonationToken = "staging-private-acknowledgement-token";
let checks = 0;

function pass(message) {
  checks += 1;
  console.log(`✓ ${message}`);
}

async function get(path, options = {}) {
  const response = await fetch(new URL(path, baseUrl), {
    redirect: "follow",
    headers: { "user-agent": "Amaana-Staging-Acceptance/1.0" },
    ...options,
  });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response;
}

async function getHtml(path) {
  const response = await get(path);
  const contentType = response.headers.get("content-type") ?? "";
  assert.match(contentType, /text\/html/i, `${path} did not return HTML`);
  return { response, html: await response.text() };
}

async function postJson(path, body) {
  return fetch(new URL(path, baseUrl), {
    method: "POST",
    redirect: "follow",
    headers: {
      "content-type": "application/json",
      "origin": requestOrigin,
      "user-agent": "Amaana-Staging-Acceptance/1.0",
    },
    body: JSON.stringify(body),
  });
}

function expectText(html, text, context) {
  assert.ok(html.includes(text), `${context} is missing expected text: ${text}`);
  pass(`${context}: ${text}`);
}


function getAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"));
  return match?.[1] ?? null;
}

function findMeta(html, key, value) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (getAttribute(tag, key) === value) return getAttribute(tag, "content");
  }
  return null;
}

function findCanonical(html) {
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    if (getAttribute(tag, "rel")?.toLowerCase() === "canonical") return getAttribute(tag, "href");
  }
  return null;
}

function normalizeComparableUrl(value) {
  const url = new URL(value);
  const path = url.pathname === "/" ? "" : url.pathname.replace(/\/$/, "");
  return `${url.origin}${path}${url.search}${url.hash}`;
}

function normalizeGeneratedImageUrl(value) {
  const url = new URL(value);
  return `${url.origin}${url.pathname}`;
}

function expectSeoMetadata(html, path, context) {
  const expectedUrl = new URL(path, requestOrigin).href;
  assert.equal(normalizeComparableUrl(findCanonical(html)), normalizeComparableUrl(expectedUrl), `${context} canonical URL mismatch`);
  pass(`${context}: canonical URL`);

  const description = findMeta(html, "name", "description");
  assert.ok(description && description.length >= 50, `${context} description is missing or too short`);
  pass(`${context}: meta description`);

  assert.equal(normalizeComparableUrl(findMeta(html, "property", "og:url")), normalizeComparableUrl(expectedUrl), `${context} og:url mismatch`);
  pass(`${context}: og:url`);

  const ogTitle = findMeta(html, "property", "og:title");
  const ogDescription = findMeta(html, "property", "og:description");
  assert.ok(ogTitle?.includes("Amaana Foundation"), `${context} Open Graph title is missing Amaana Foundation`);
  assert.ok(ogDescription && ogDescription.length >= 40, `${context} Open Graph description is missing or too short`);
  pass(`${context}: Open Graph title and description`);
}

function expectHeader(response, name, pattern, context) {
  const value = response.headers.get(name) ?? "";
  assert.match(value, pattern, `${context} header ${name} was ${JSON.stringify(value)}`);
  pass(`${context}: ${name}`);
}

console.log(`Running Amaana staging acceptance checks against ${baseUrl.origin}`);
console.log(`Using configured same-origin header ${requestOrigin} for CSRF-protected staging checks`);

const version = await get("/api/health/version");
const versionPayload = await version.json();
assert.equal(versionPayload.status, "ok", "Version endpoint did not return status=ok");
expectHeader(version, "cache-control", /no-store/i, "version endpoint");
if (expectedCommitSha) {
  assert.equal(versionPayload.commitSha, expectedCommitSha, `Staging is not serving expected commit ${expectedCommitSha}`);
  pass(`exact candidate commit ${expectedCommitSha}`);
} else {
  pass("deployment version endpoint");
}

const health = await get("/api/health/live");
const healthPayload = await health.json();
assert.equal(healthPayload.status, "ok", "Live health endpoint did not return status=ok");
pass("live health endpoint");
expectHeader(health, "cache-control", /no-store/i, "health endpoint");
expectHeader(health, "x-content-type-options", /^nosniff$/i, "health endpoint");
expectHeader(health, "x-frame-options", /^DENY$/i, "health endpoint");

const readiness = await get("/api/health/ready");
const readinessPayload = await readiness.json();
assert.equal(readinessPayload.status, "ready", "Readiness endpoint did not return status=ready");
pass("database and production-environment readiness endpoint");
expectHeader(readiness, "cache-control", /no-store/i, "readiness endpoint");

const home = await getHtml("/");
expectText(home.html, "Amaana Foundation", "homepage identity");
assert.match(home.html, /name=["']robots["'][^>]*noindex|content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i, "Staging homepage is not explicitly noindex");
pass("staging homepage remains noindex");
expectSeoMetadata(home.html, "/", "homepage SEO");

const homeOgImage = findMeta(home.html, "property", "og:image");
assert.equal(normalizeGeneratedImageUrl(homeOgImage), normalizeGeneratedImageUrl(new URL("/opengraph-image", requestOrigin).href), "Homepage og:image is not the canonical Amaana social image");
pass("homepage: Open Graph image");

assert.equal(findMeta(home.html, "name", "twitter:card"), "summary_large_image", "Homepage Twitter card must use summary_large_image");
assert.equal(normalizeGeneratedImageUrl(findMeta(home.html, "name", "twitter:image")), normalizeGeneratedImageUrl(new URL("/twitter-image", requestOrigin).href), "Homepage twitter:image mismatch");
pass("homepage: Twitter card and image");

const structuredDataScripts = [...home.html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
assert.ok(structuredDataScripts.length > 0, "Homepage is missing JSON-LD structured data");
const structuredData = structuredDataScripts.map(match => JSON.parse(match[1]));
const serializedStructuredData = JSON.stringify(structuredData);
assert.match(serializedStructuredData, /"Organization"/, "Structured data is missing Organization");
assert.match(serializedStructuredData, /"NGO"/, "Structured data is missing NGO");
assert.match(serializedStructuredData, /"WebSite"/, "Structured data is missing WebSite");
assert.ok(serializedStructuredData.includes(requestOrigin), "Structured data does not reference the configured staging origin");
pass("homepage: Organization, NGO and WebSite structured data");

for (const path of ["/about", "/our-work", "/appeals", "/privacy", "/transparency", "/donate"]) {
  const page = await getHtml(path);
  pass(`public route ${path}`);
  expectSeoMetadata(page.html, path, `${path} SEO`);
}

const robots = await get("/robots.txt");
const robotsBody = await robots.text();
assert.match(robotsBody, /User-agent:\s*\*/i, "robots.txt is missing wildcard user-agent");
assert.match(robotsBody, /Disallow:\s*\//i, "Staging robots.txt does not block crawling");
assert.doesNotMatch(robotsBody, /Sitemap:/i, "Staging robots.txt must not advertise a sitemap while indexing is disabled");
pass("staging robots.txt remains fail-closed");

const sitemap = await get("/sitemap.xml");
const sitemapBody = await sitemap.text();
assert.doesNotMatch(sitemapBody, /<url>/i, "Staging sitemap exposes public URLs while indexing is disabled");
pass("staging sitemap remains empty while indexing is disabled");

for (const imagePath of ["/opengraph-image", "/twitter-image"]) {
  const image = await get(imagePath);
  assert.match(image.headers.get("content-type") ?? "", /^image\//i, `${imagePath} did not return an image content type`);
  const bytes = new Uint8Array(await image.arrayBuffer());
  assert.ok(bytes.byteLength > 1000, `${imagePath} image payload is unexpectedly small`);
  pass(`social image ${imagePath}`);
}

const appeals = await getHtml("/appeals");
expectText(appeals.html, "Verified Needs. Clear Purpose. Responsible Support.", "appeals page");
expectText(appeals.html, "Amaana does not accept foreign contributions", "appeals domestic-only boundary");

if (appeals.html.includes("STAGING TEST")) {
  pass("synthetic staging checkout fixture is present");
  const appeal = await getHtml(`/appeals/${syntheticSlug}`);
  expectText(appeal.html, "STAGING TEST — Checkout acceptance", "synthetic appeal detail");
  expectText(appeal.html, "INR · India only", "synthetic appeal donation boundary");
  expectText(appeal.html, "Supporting documents used during review remain private", "synthetic appeal privacy boundary");

  const donation = await getHtml(`/donate/${syntheticSlug}`);
  expectText(donation.html, "Domestic contribution confirmation", "donation form domestic-source confirmation");
  expectText(donation.html, "Razorpay", "donation form payment provider disclosure");
  expectText(donation.html, "not an 80G tax-deduction certificate", "donation acknowledgement boundary");
} else {
  console.log("• Synthetic checkout fixture is not seeded in this staging database; deployed checkout-specific checks are skipped. Mocked browser CI remains the mandatory donation-journey gate.");
}

const acknowledgement = await postJson("/api/donations/acknowledgement", {
  reference: syntheticDonationReference,
  token: syntheticDonationToken,
});
if (acknowledgement.status === 200) {
  expectHeader(acknowledgement, "cache-control", /no-store/i, "private acknowledgement API");
  const payload = await acknowledgement.json();
  assert.equal(payload.found, true, "Synthetic acknowledgement did not return found=true");
  assert.equal(payload.presentation?.tone, "refunded", "Synthetic acknowledgement is not in refunded presentation state");
  assert.equal(payload.donation?.referenceNumber, syntheticDonationReference, "Synthetic acknowledgement reference mismatch");
  assert.equal(payload.donation?.amount, 100, "Synthetic acknowledgement original amount mismatch");
  assert.equal(payload.donation?.refundedAmount, 100, "Synthetic acknowledgement refunded amount mismatch");
  assert.equal(payload.donation?.receiptNumber, `ACK-${syntheticDonationReference}`, "Synthetic acknowledgement receipt number mismatch");
  pass("synthetic refunded donation acknowledgement state");
} else if (acknowledgement.status === 404) {
  console.log("• Synthetic refunded-donation fixture is not seeded yet; private refund/receipt runtime verification remains pending.");
} else {
  throw new Error(`Synthetic acknowledgement returned unexpected status ${acknowledgement.status}`);
}

const assistance = await getHtml("/request-assistance");
expectHeader(assistance.response, "cache-control", /no-store/i, "assistance page");
expectHeader(assistance.response, "x-content-type-options", /^nosniff$/i, "assistance page");
expectHeader(assistance.response, "x-frame-options", /^DENY$/i, "assistance page");
expectText(assistance.html, "Private submission", "assistance privacy framing");
expectText(assistance.html, "submission does not guarantee assistance or public fundraising", "assistance expectation boundary");
expectText(assistance.html, "Uploading a document does not give Amaana permission to publish it", "assistance document consent boundary");

console.log(`\nAmaana staging launch acceptance passed: ${checks} checks.`);
