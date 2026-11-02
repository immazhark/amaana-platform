/** AF-R080: read-only public HTML identity check, not a Google rich-result approval. */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const origin = "https://amaanafoundation.org";
const maxHtmlBytes = 2_000_000;
export const PUBLIC_SCHEMA_ROUTES = Object.freeze(["/", "/about", "/impact", "/donate", "/stories"]);
const expectedIds = [`${origin}/#organization`, `${origin}/#website`];

function attribute(raw, name) {
  const attributes = new Map();
  const tokens = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of raw.matchAll(tokens)) {
    const key = match[1].toLowerCase();
    if (attributes.has(key)) throw new Error("Duplicate HTML attribute on public schema tag");
    attributes.set(key, match[2] ?? match[3] ?? match[4] ?? null);
  }
  return attributes.get(name.toLowerCase()) ?? null;
}

function rootNodes(html) {
  const nodes = [];
  for (const tag of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (attribute(tag[1], "type")?.toLowerCase() !== "application/ld+json") continue;
    let parsed;
    try { parsed = JSON.parse(tag[2]); }
    catch { throw new Error("Malformed JSON-LD in public document"); }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      throw new Error("Malformed JSON-LD root");
    }
    if (parsed["@context"] !== "https://schema.org") {
      throw new Error("Unexpected JSON-LD vocabulary context");
    }
    const entries = parsed["@graph"] ?? [parsed];
    if (!Array.isArray(entries)) throw new Error("Malformed JSON-LD graph");
    for (const entry of entries) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        throw new Error("Malformed JSON-LD node");
      }
      nodes.push(entry);
    }
  }
  return nodes;
}

function isType(node, name) {
  return Array.isArray(node["@type"]) ? node["@type"].includes(name) : node["@type"] === name;
}

// A tag-shaped string inside an attribute is text, not a DOM element. Keep tag
// delimiters only when outside quoted attributes before inspecting HTML tags.
function neutralizeQuotedMarkup(html) {
  let output = "";
  for (let i = 0; i < html.length;) {
    if (html[i] !== "<" || !/^<\/?[a-z][\w:-]*/i.test(html.slice(i, i + 32))) {
      output += html[i++];
      continue;
    }
    let quote = null;
    let closed = false;
    let first = true;
    for (; i < html.length; i++) {
      const char = html[i];
      if (quote !== null) {
        if (char === quote) quote = null;
        output += char === "<" || char === ">" ? " " : char;
      } else {
        if (char === "'" || char === '"') quote = char;
        if (char === "<" && !first) throw new Error("Nested tag delimiter in public markup");
        output += char;
        if (char === ">") { closed = true; i++; break; }
      }
      first = false;
    }
    if (!closed) throw new Error("Unclosed public HTML tag");
  }
  return output;
}

function stripInertMarkup(html) {
  const withoutComments = neutralizeQuotedMarkup(html.replace(/<!--[\s\S]*?-->/g, ""));
  if (withoutComments.includes("<!--")) throw new Error("Unclosed HTML comment in structured-data document");
  if (/<plaintext\b/i.test(withoutComments)) {
    throw new Error("Unparseable plaintext HTML mode in public document");
  }
  const withoutRawText = withoutComments
    .replace(/<(style|title|xmp|noembed|noframes)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<script\b([^>]*)>[\s\S]*?<\/script\s*>/gi, (full, attrs) =>
      attribute(attrs, "type")?.toLowerCase() === "application/ld+json" ? full : "");
  const inertTags = /<\/?(template|noscript|textarea|iframe|object|svg)\b[^>]*>/gi;
  const stack = [];
  let cleaned = "";
  let cursor = 0;
  for (const match of withoutRawText.matchAll(inertTags)) {
    if (stack.length === 0) cleaned += withoutRawText.slice(cursor, match.index);
    const name = match[1].toLowerCase();
    if (/^<\//.test(match[0])) {
      if (stack.pop() !== name) throw new Error("Malformed inert HTML nesting");
    } else {
      stack.push(name);
    }
    cursor = match.index + match[0].length;
  }
  if (stack.length > 0) throw new Error("Unclosed inert HTML region");
  return cleaned + withoutRawText.slice(cursor);
}

function rejectPrivateLinks(value) {
  if (Array.isArray(value)) {
    for (const item of value) rejectPrivateLinks(item);
  } else if (typeof value === "object" && value !== null) {
    for (const nested of Object.values(value)) rejectPrivateLinks(nested);
  } else if (typeof value === "string") {
    if (!/^https?:\/\//i.test(value) && !value.startsWith("/") && !value.startsWith("\\")) return;
    let url;
    try { url = new URL(value, origin); }
    catch { return; }
    let path = url.pathname;
    try {
      for (let attempt = 0; attempt < 8; attempt++) {
        const decoded = decodeURIComponent(path);
        if (decoded === path) break;
        path = decoded;
      }
    } catch { throw new Error("Unsafe URL encoding in public JSON-LD"); }
    if (/%[a-f0-9]{2}/i.test(path) || path.includes("\\")) {
      throw new Error("Ambiguous private-route encoding in public JSON-LD");
    }
    path = path.replace(/\/+/g, "/");
    const forbiddenKey = key => /^(?:token|receipttoken|receipt_token|session|key)$/i.test(key);
    const forbiddenParameter = [...url.searchParams.keys(), ...new URLSearchParams(url.hash.slice(1)).keys()]
      .some(forbiddenKey);
    const privatePrefix = ["/admin", "/api", "/documents", "/donations",
      "/request-assistance/status", "/request-assistance/received"]
      .some(prefix => path.toLowerCase() === prefix || path.toLowerCase().startsWith(prefix + "/"));
    if (privatePrefix || /^\/donate\//i.test(path) || forbiddenParameter) {
      throw new Error("Private route or token was placed in public JSON-LD");
    }
  }
}

export function analyzePublicSchemaHtml(path, html) {
  if (!PUBLIC_SCHEMA_ROUTES.includes(path)) throw new Error("A fixed public route is required");
  if (typeof html !== "string" || Buffer.byteLength(html, "utf8") > maxHtmlBytes || !html.includes("<html")) {
    throw new Error("Invalid or oversized public HTML");
  }
  const visibleHtml = stripInertMarkup(html);
  const head = /<head\b[^>]*>([\s\S]*?)<\/head\s*>/i.exec(visibleHtml);
  if (!head) throw new Error("Public head markup is missing");
  const headWithoutJsonScripts = head[1].replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  const canonicals = [...headWithoutJsonScripts.matchAll(/<link\b([^>]*)>/gi)]
    .filter(tag => attribute(tag[1], "rel")?.toLowerCase() === "canonical")
    .map(tag => attribute(tag[1], "href"));
  const expectedCanonical = `${origin}${path}`;
  if (canonicals.length !== 1 || canonicals[0] !== expectedCanonical) {
    throw new Error("Public canonical URL is absent, duplicated or inconsistent");
  }
  const nodes = rootNodes(visibleHtml);
  for (const node of nodes) rejectPrivateLinks(node);
  const organizations = nodes.filter(node => isType(node, "Organization") || isType(node, "NGO"));
  const websites = nodes.filter(node => isType(node, "WebSite"));
  if (organizations.length !== 1 || websites.length !== 1) {
    throw new Error("Public Organization/Website graph has missing or conflicting identity nodes");
  }
  const organization = organizations[0];
  const website = websites[0];
  if (!isType(organization, "Organization") || !isType(organization, "NGO") ||
      organization["@id"] !== expectedIds[0] || organization.name !== "Amaana Foundation" ||
      organization.url !== origin || website["@id"] !== expectedIds[1] ||
      website.url !== origin || website.publisher?.["@id"] !== expectedIds[0]) {
    throw new Error("Public structured-data organization identity mismatch");
  }
  const noindex = [...visibleHtml.matchAll(/<meta\b([^>]*)>/gi)]
    .some(tag => ["robots", "googlebot", "bingbot"].includes(attribute(tag[1], "name")?.toLowerCase()) &&
      /(?:^|[,\s])noindex(?:$|[,\s])/i.test(attribute(tag[1], "content") ?? ""));
  return {
    status: "STRUCTURE_VALID_EXTERNAL_ACCEPTANCE_PENDING",
    path,
    canonical: expectedCanonical,
    indexingDirective: noindex ? "NOINDEX" : "NO_EXPLICIT_NOINDEX",
    verifiedGraphIds: expectedIds,
  };
}

async function readHtmlLimited(response) {
  if (!response.body) throw new Error("Public document body missing");
  const reader = response.body.getReader();
  const chunks = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxHtmlBytes) throw new Error("Public document exceeds size limit");
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  } finally {
    reader.releaseLock();
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks));
}

export async function auditPublicSchema(fetchImpl = fetch) {
  const pages = [];
  for (const path of PUBLIC_SCHEMA_ROUTES) {
    const target = `${origin}${path}`;
    const response = await fetchImpl(target, { redirect: "manual", signal: AbortSignal.timeout(12_000),
      headers: { accept: "text/html" } });
    if (response.status !== 200 || response.url !== target ||
        !response.headers.get("content-type")?.toLowerCase().includes("text/html")) {
      throw new Error("Unexpected HTTP response/redirect/content type on public route: " + path);
    }
    if (Number(response.headers.get("content-length")) > maxHtmlBytes) {
      throw new Error("Unexpectedly large public document on route: " + path);
    }
    const result = analyzePublicSchemaHtml(path, await readHtmlLimited(response));
    pages.push({ ...result,
      httpIndexingDirective: /noindex/i.test(response.headers.get("x-robots-tag") ?? "") ? "NOINDEX" : "UNSPECIFIED" });
  }
  let runtimeSha = null;
  try {
    const version = await fetchImpl(`${origin}/api/health/version`, { redirect: "manual", signal: AbortSignal.timeout(5_000) });
    if (version.status === 200 && version.url === `${origin}/api/health/version`) {
      const data = await version.json();
      if (typeof data.commitSha === "string" && /^[a-f0-9]{40}$/.test(data.commitSha)) runtimeSha = data.commitSha;
    }
  } catch { /* Runtime identity remains unknown, never inferred. */ }
  return {
    measuredAt: new Date().toISOString(),
    origin,
    runtimeSha,
    runtimeShaObserved: runtimeSha !== null,
    publicReadinessVerified: false,
    externalRichResultAccepted: false,
    pages,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) {
    process.stderr.write("No arbitrary origin or route arguments are permitted.\n");
    process.exitCode = 2;
  } else {
    try { process.stdout.write(JSON.stringify(await auditPublicSchema(), null, 2) + "\n"); }
    catch (error) {
      process.stderr.write("AF-R080 live schema observation failed: " + (error instanceof Error ? error.message : "unknown") + "\n");
      process.exitCode = 1;
    }
  }
}
