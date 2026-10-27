import { pathToFileURL } from "node:url";

const ORIGIN = "https://amaanafoundation.org";
const PUBLIC_ROUTES = Object.freeze(["/", "/our-work", "/impact", "/donate", "/request-assistance"]);

function attr(tag, name) {
  const match = tag.match(new RegExp("(?:^|\\s)" + name + "\\s*=\\s*(?:\"([^\"]*)\"|'([^']*)'|([^\\s>]+))", "i"));
  return match ? (match[1] ?? match[2] ?? match[3]) : null;
}

/** Resolve same-origin Next CSS referenced by rendered public HTML. */
export function stylesheetsInHtml(html, origin = ORIGIN) {
  if (typeof html !== "string") throw new TypeError("HTML must be text");
  const site = new URL(origin);
  if (!/^https?:$/.test(site.protocol) || site.username || site.password) throw new Error("Origin must use HTTP(S) without credentials");
  const unique = new Set();
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const rel = attr(match[0], "rel");
    const raw = attr(match[0], "href");
    if (!rel?.toLowerCase().split(/\s+/).includes("stylesheet") || !raw) continue;
    let asset;
    try { asset = new URL(raw.replaceAll("&amp;", "&"), site); }
    catch { continue; }
    if (asset.origin !== site.origin || asset.username || asset.password) continue;
    if (!/^\/_next\/static\/[A-Za-z0-9_./-]+\.css$/.test(asset.pathname)) continue;
    if (asset.pathname.split("/").includes("..")) continue;
    unique.add(asset.origin + asset.pathname);
  }
  return [...unique];
}

/** Decoded stylesheet bytes; not compressed transfer or Core Web Vitals. */
export function summarizeRouteCssBytes(entries, sizes) {
  const unique = new Set();
  const routes = entries.map(({ route, stylesheets }) => {
    let cssBytes = 0;
    const current = [...new Set(stylesheets)];
    for (const asset of current) {
      const bytes = sizes.get(asset);
      if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error("Missing CSS size for " + asset);
      cssBytes += bytes;
      unique.add(asset);
    }
    return { route, stylesheetCount: current.length, cssBytes };
  });
  return { routes, shared: {
    uniqueStylesheets: unique.size,
    decodedCssBytes: [...unique].reduce((total, asset) => total + sizes.get(asset), 0),
  } };
}

/** Browser-linked CSS response sizes. Zero transfer can mean cache or opaque timing. */
export function summarizeLinkedCssResourceTiming(hrefs, resourceTimings) {
  if (!Array.isArray(hrefs) || !Array.isArray(resourceTimings)) {
    throw new TypeError("Browser CSS links and timings must be arrays");
  }
  const uniqueHrefs = [...new Set(hrefs)];
  if (uniqueHrefs.some(href => typeof href !== "string" || !href)) {
    throw new TypeError("Browser CSS links must be nonempty URLs");
  }
  const byHref = new Map();
  for (const entry of resourceTimings) {
    if (!entry || typeof entry.name !== "string") throw new TypeError("Invalid browser CSS timing entry");
    if (!byHref.has(entry.name)) byHref.set(entry.name, entry);
  }

  let decodedBodyBytes = 0;
  let encodedBodyBytes = 0;
  let observedTransferBytes = 0;
  let incompleteBody = false;
  const missingTimingStylesheets = [];
  const unavailableTransferStylesheets = [];

  for (const href of uniqueHrefs) {
    const timing = byHref.get(href);
    if (!timing) {
      missingTimingStylesheets.push(href);
      unavailableTransferStylesheets.push(href);
      incompleteBody = true;
      continue;
    }
    const { decodedBodySize, encodedBodySize, transferSize } = timing;
    if (![decodedBodySize, encodedBodySize, transferSize].every(value => Number.isSafeInteger(value) && value >= 0)) {
      throw new TypeError("Invalid browser CSS timing for " + href);
    }
    // All-zero timing cannot prove an empty response: cache and opaque resources also return zero.
    if (decodedBodySize === 0 && encodedBodySize === 0 && transferSize === 0) {
      incompleteBody = true;
    } else {
      decodedBodyBytes += decodedBodySize;
      encodedBodyBytes += encodedBodySize;
    }
    if (transferSize === 0) unavailableTransferStylesheets.push(href);
    else observedTransferBytes += transferSize;
  }

  return {
    metric: "browser-linked-css-resource-timing",
    stylesheetCount: uniqueHrefs.length,
    decodedBodyBytes: incompleteBody ? null : decodedBodyBytes,
    encodedBodyBytes: incompleteBody ? null : encodedBodyBytes,
    transferBytes: unavailableTransferStylesheets.length ? null : observedTransferBytes,
    observedTransferBytes,
    missingTimingStylesheets,
    unavailableTransferStylesheets,
    disclaimer: "Browser navigation Resource Timing for linked CSS only. Cache/opaque/missing transfers are unavailable; partial observed bytes are not complete transfer. Not field Web Vitals or public production traffic.",
  };
}

/** Read-only, unauthenticated measurement against fixed public paths. */
export async function auditPublicRouteCss({ fetchImpl = fetch, routes = PUBLIC_ROUTES } = {}) {
  const site = new URL(ORIGIN);
  const entries = [];
  const sizes = new Map();
  async function request(url) {
    // Never permit an external hop before validating the target origin.
    const response = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (response.status >= 300 && response.status < 400) throw new Error("Redirect not permitted in public route CSS audit: " + url);
    if (!response.ok) throw new Error("Public route CSS audit HTTP error at " + url);
    if (!response.url || new URL(response.url).origin !== site.origin) throw new Error("Public route CSS audit unexpected origin at " + url);
    return response;
  }
  for (const route of routes) {
    if (typeof route !== "string" || !/^\/(?!\/)/.test(route) || route.includes("..") || route.includes("?") || route.includes("#") || route.includes("\\")) {
      throw new Error("Invalid public route: " + route);
    }
    const pageUrl = new URL(route, site);
    if (pageUrl.origin !== site.origin) throw new Error("Invalid public route: " + route);
    const html = await (await request(pageUrl.href)).text();
    const stylesheets = stylesheetsInHtml(html, site.href);
    entries.push({ route, stylesheets });
    for (const asset of stylesheets) {
      if (sizes.has(asset)) continue;
      const response = await request(asset);
      const contentType = response.headers?.get("content-type") ?? null;
      if (!contentType || !/^text\/css(?:\s*;|$)/i.test(contentType)) throw new Error("Stylesheet response is not CSS: " + asset);
      const body = await response.arrayBuffer();
      sizes.set(asset, body.byteLength);
    }
  }
  return {
    metric: "rendered-public-route-decoded-css-bytes",
    source: site.origin,
    disclaimer: "Decoded stylesheet response bytes only. Not compressed transfer bytes, unused CSS, LCP, INP, or CLS.",
    ...summarizeRouteCssBytes(entries, sizes),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  auditPublicRouteCss().then(report => {
    if (process.argv.includes("--json")) process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    else {
      for (const row of report.routes) process.stdout.write(row.route.padEnd(24) + " " + String(row.cssBytes).padStart(9) + " decoded CSS bytes, " + row.stylesheetCount + " stylesheets\n");
      process.stdout.write(report.disclaimer + "\n");
    }
  }).catch(error => { process.stderr.write(String(error) + "\n"); process.exitCode = 1; });
}
