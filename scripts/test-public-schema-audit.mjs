import assert from "node:assert/strict";
import test from "node:test";
import { analyzePublicSchemaHtml, auditPublicSchema, PUBLIC_SCHEMA_ROUTES } from "./audit-public-schema.mjs";

const origin = "https://amaanafoundation.org";
const graph = [
  { "@type": ["Organization", "NGO"], "@id": `${origin}/#organization`, name: "Amaana Foundation", url: origin },
  { "@type": "WebSite", "@id": `${origin}/#website`, url: origin,
    publisher: { "@id": `${origin}/#organization` } },
];

function page(htmlGraph = graph, canonical = `${origin}/`, extra = "") {
  return `<html><head><link rel="canonical" href="${canonical}">${extra}</head><body>` +
    `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": htmlGraph })}</script>` +
    `<main>Public page</main></body></html>`;
}

test("a valid root public identity is structure-valid, not externally rich-result verified", () => {
  assert.deepEqual(PUBLIC_SCHEMA_ROUTES, ["/", "/about", "/impact", "/donate", "/stories"]);
  const result = analyzePublicSchemaHtml("/", page());
  assert.equal(result.status, "STRUCTURE_VALID_EXTERNAL_ACCEPTANCE_PENDING");
  assert.equal(result.canonical, `${origin}/`);
  assert.equal(result.indexingDirective, "NO_EXPLICIT_NOINDEX");
  assert.deepEqual(result.verifiedGraphIds, [`${origin}/#organization`, `${origin}/#website`]);
});

test("missing, mismatched or spoofed NGO and Website identity fails closed", () => {
  for (const candidate of [
    [graph[1]],
    [graph[0]],
    [{ ...graph[0], name: "Other Trust" }, graph[1]],
    [{ ...graph[0], "@id": "https://evil.invalid/#organization" }, graph[1]],
    [graph[0], { ...graph[1], publisher: { "@id": "https://evil.invalid/#organization" } }],
  ]) assert.throws(() => analyzePublicSchemaHtml("/", page(candidate)));
});

test("missing, duplicate and off-origin canonical signals fail closed", () => {
  assert.throws(() => analyzePublicSchemaHtml("/", page().replace(/<link rel="canonical"[^>]+>/, "")));
  assert.throws(() => analyzePublicSchemaHtml("/", page(graph, "https://evil.invalid/")));
  assert.throws(() => analyzePublicSchemaHtml("/", page(graph, `${origin}/`, '<link rel="canonical" href="https://other.invalid/">')));
  assert.throws(() => analyzePublicSchemaHtml("/about", page(graph, `${origin}/`)));
});

test("private route, token or identity-media references in JSON-LD fail closed", () => {
  for (const url of [
    `${origin}/admin/team`, `${origin}/api/admin/private`,
    `${origin}/documents/private`, `${origin}/donate?token=synthetic`,
    `${origin}/api/donations/acknowledgement?token=synthetic`,
    "/admin/team", "/api/admin/private", `${origin}/%61dmin/team`,
    "/api/%61dmin/private", "/documents/private", "/donate?token=synthetic",
    "/donations/AFD-2026-12345678/acknowledgement#token=synthetic-sensitive-value",
    "/request-assistance/status#token=synthetic-sensitive-value", "/request-assistance/received",
    "/donate/internal-path", `${origin}/donate#token=synthetic-sensitive-value`,
    "/%25252561dmin/private", "/%5cadmin/private",
  ]) {
    const suspect = [{ ...graph[0], sameAs: [url] }, graph[1]];
    assert.throws(() => analyzePublicSchemaHtml("/", page(suspect)));
  }
});

test("noindex is preserved as a distinct observed restriction", () => {
  const result = analyzePublicSchemaHtml("/", page(graph, `${origin}/`, '<meta name="robots" content="noindex,nofollow">'));
  assert.equal(result.indexingDirective, "NOINDEX");
  assert.equal(result.status, "STRUCTURE_VALID_EXTERNAL_ACCEPTANCE_PENDING");
  const googlebot = analyzePublicSchemaHtml("/", page(graph, `${origin}/`, '<meta name="googlebot" content="noindex">'));
  assert.equal(googlebot.indexingDirective, "NOINDEX");
});

test("malformed JSON-LD, duplicate organization IDs and oversized HTML fail closed", () => {
  assert.throws(() => analyzePublicSchemaHtml("/", page().replace('"@context":"https://schema.org"', '"@context":{')));
  assert.throws(() => analyzePublicSchemaHtml("/", page([graph[0], graph[0], graph[1]])));
  assert.throws(() => analyzePublicSchemaHtml("/", page().replace('https://schema.org', 'https://evil.invalid/context')));
  assert.throws(() => analyzePublicSchemaHtml("/", "x".repeat(2_500_000)));
});

test("HTML comments cannot spoof executable JSON-LD identity", () => {
  const original = page();
  const hidden = original.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/,
    match => `<!--${match}-->`);
  assert.throws(() => analyzePublicSchemaHtml("/", hidden));
});

test("inert template or noscript markup cannot spoof public canonical or JSON-LD", () => {
  const valid = page();
  for (const tag of ["template", "noscript"]) {
    const inertOnly = `<html><head></head><body><${tag}>${valid}</${tag}></body></html>`;
    assert.throws(() => analyzePublicSchemaHtml("/", inertOnly));
  }
  const canonicalOnlyInTemplate = `<html><head><template><link rel="canonical" href="${origin}/"></template></head>` +
    `<body><script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph })}</script></body></html>`;
  assert.throws(() => analyzePublicSchemaHtml("/", canonicalOnlyInTemplate));
});

test("attribute-looking text within quoted attribute values cannot spoof rel/type", () => {
  const valid = page();
  const spoofedScript = valid.replace('type="application/ld+json"',
    'data-hint="foo type=\'application/ld+json\'"');
  assert.throws(() => analyzePublicSchemaHtml("/", spoofedScript));
  const spoofedCanonical = valid.replace('rel="canonical"', 'data-hint="foo rel=\'canonical\'"');
  assert.throws(() => analyzePublicSchemaHtml("/", spoofedCanonical));
});

test("tags inside another HTML attribute's quoted text are not active markup", () => {
  const canonical = `<link rel="canonical" href="${origin}/">`;
  const json = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const schema = `<script type="application/ld+json">${json}</script>`;
  const spoof = `<html><head><meta data-hidden='${canonical}'></head>` +
    `<body><div data-hidden='${schema}'></div></body></html>`;
  assert.throws(() => analyzePublicSchemaHtml("/", spoof));
});

test("raw style and ordinary script text cannot impersonate active canonical or JSON-LD", () => {
  const validGraph = JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
  const canonicalTag = `<link rel="canonical" href="${origin}/">`;
  const schemaTag = `<script type="application/ld+json">${validGraph}</script>`;
  const styleOnly = `<html><head><style>${canonicalTag}${schemaTag}</style></head><body></body></html>`;
  assert.throws(() => analyzePublicSchemaHtml("/", styleOnly));
  const scriptOnly = `<html><head><script>const fake = '${canonicalTag}';</script></head><body>${schemaTag}</body></html>`;
  assert.throws(() => analyzePublicSchemaHtml("/", scriptOnly));
  const embedded = JSON.stringify({ "@context": "https://schema.org",
    metadata: `<link rel='canonical' href='${origin}/'>`, "@graph": graph });
  const jsonStringCanonical = `<html><head><script type="application/ld+json">${embedded}</script></head><body></body></html>`;
  assert.throws(() => analyzePublicSchemaHtml("/", jsonStringCanonical));
});

test("plaintext mode cannot impersonate active structured-data markup", () => {
  const valid = page();
  const plaintext = valid.replace("<body>", "<body><plaintext>").replace("</body>", "</plaintext></body>");
  assert.throws(() => analyzePublicSchemaHtml("/", plaintext));
});

test("auditor cannot be turned toward arbitrary admin routes or other origins", () => {
  assert.throws(() => analyzePublicSchemaHtml("/admin", page()));
  assert.throws(() => analyzePublicSchemaHtml("https://evil.invalid/", page()));
  assert.throws(() => analyzePublicSchemaHtml("/about?token=1", page()));
});

test("five-route live transport simulation preserves unknown runtime and unverified indexing", async () => {
  const observed = [];
  const fakeFetch = async target => {
    observed.push(target);
    if (target.endsWith("/api/health/version")) throw new Error("synthetic version outage");
    const response = new Response(page(graph, target), { status: 200, headers: { "Content-Type": "text/html" } });
    Object.defineProperty(response, "url", { value: target });
    return response;
  };
  const report = await auditPublicSchema(fakeFetch);
  assert.equal(report.pages.length, 5);
  assert.equal(report.runtimeSha, null);
  assert.equal(report.runtimeShaObserved, false);
  assert.equal(report.publicReadinessVerified, false);
  assert.equal(report.externalRichResultAccepted, false);
  assert.ok(observed.every(uri => uri.startsWith(origin)));
});

test("redirects and unexpected transport origins fail before schema acceptance", async () => {
  for (const spoof of [
    { status: 302, url: `${origin}/` },
    { status: 200, url: "https://evil.invalid/" },
  ]) {
    const fakeFetch = async () => {
      const response = new Response(page(), { status: spoof.status,
        headers: { "Content-Type": "text/html" } });
      Object.defineProperty(response, "url", { value: spoof.url });
      return response;
    };
    await assert.rejects(auditPublicSchema(fakeFetch));
  }
});

test("non-HTML, absent-body and oversized transport responses fail closed", async () => {
  for (const fixture of [
    { body: page(), headers: { "Content-Type": "text/plain" } },
    { body: null, headers: { "Content-Type": "text/html" } },
    { body: "x".repeat(2_100_000), headers: { "Content-Type": "text/html" } },
    { body: page(), headers: { "Content-Type": "text/html", "Content-Length": "2100000" } },
  ]) {
    const fakeFetch = async target => {
      const response = new Response(fixture.body, { status: 200, headers: fixture.headers });
      Object.defineProperty(response, "url", { value: target });
      return response;
    };
    await assert.rejects(auditPublicSchema(fakeFetch));
  }
});
