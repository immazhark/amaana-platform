import { pathToFileURL } from "node:url";

const ORIGIN = "https://amaanafoundation.org";
const PUBLIC_ROUTES = Object.freeze(["/", "/our-work", "/impact", "/donate", "/request-assistance"]);

function attr(attributes, name) {
  const tokens = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  for (const match of attributes.matchAll(tokens)) {
    if (match[1].toLowerCase() === name) return match[2] ?? match[3] ?? match[4] ?? null;
  }
  return null;
}

/** Links inside HTML template contents are inert until a script adopts them.
 * Keep a lightweight quote-aware tag scan so nested or unclosed templates do
 * not inflate initial rendered stylesheet attribution.
 */
function withoutInertTemplates(markup) {
  const tags = /<(\/?)([a-z][a-z0-9:_-]*)(?=[\t\n\f\r />])((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi;
  let depth = 0;
  let from = 0;
  let visible = "";
  for (const match of markup.matchAll(tags)) {
    if (match[2].toLowerCase() !== "template") continue;
    if (match[1]) {
      if (depth && --depth === 0) from = match.index + match[0].length;
    } else {
      if (depth === 0) visible += markup.slice(from, match.index);
      depth += 1;
    }
  }
  return depth ? visible : visible + markup.slice(from);
}

/** Resolve same-origin Next CSS referenced by rendered public HTML. */
export function stylesheetsInHtml(html, origin = ORIGIN) {
  if (typeof html !== "string") throw new TypeError("HTML must be text");
  const site = new URL(origin);
  if (!/^https?:$/.test(site.protocol) || site.username || site.password) throw new Error("Origin must use HTTP(S) without credentials");
  const unique = new Set();
  // Commented-out (including unterminated) links are not rendered resources.
  // Raw-text/RCDATA bodies cannot contain active stylesheet links.
  // Stop at the matching closing element so later genuine links remain visible.
  const renderedMarkup = withoutInertTemplates(html.replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    // This audit measures the script-enabled page, not no-JS fallbacks.
    .replace(/<(script|style|title|textarea|xmp|noembed|noframes|noscript)(?=[\t\n\f\r />])[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, ""));
  // Consume every complete opening tag, including quoted attributes, so a
  // link-shaped attribute value cannot become a standalone resource tag.
  const tags = /<([a-z][a-z0-9:_-]*)(?=[\t\n\f\r />])((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi;
  for (const match of renderedMarkup.matchAll(tags)) {
    if (match[1].toLowerCase() !== "link") continue;
    const rel = attr(match[2], "rel");
    const raw = attr(match[2], "href");
    if (!rel?.toLowerCase().split(/\s+/).includes("stylesheet") || !raw) continue;
    let asset;
    try { asset = new URL(raw.replaceAll("&amp;", "&"), site); }
    catch { continue; }
    if (asset.origin !== site.origin || asset.username || asset.password) continue;
    if (!/^\/_next\/static\/[A-Za-z0-9_./-]+\.css$/.test(asset.pathname)) continue;
    if (asset.pathname.split("/").includes("..")) continue;
    // Preserve the requested CSS variant. Fragments are not sent in HTTP requests.
    unique.add(asset.origin + asset.pathname + asset.search);
  }
  return [...unique];
}

function addCssBytes(total, bytes, scope) {
  const sum = total + bytes;
  if (!Number.isSafeInteger(sum)) throw new Error(`CSS ${scope} size exceeds safe integer`);
  return sum;
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
      cssBytes = addCssBytes(cssBytes, bytes, "route");
      unique.add(asset);
    }
    return { route, stylesheetCount: current.length, cssBytes };
  });
  return { routes, shared: {
    uniqueStylesheets: unique.size,
    decodedCssBytes: [...unique].reduce((total, asset) => addCssBytes(total, sizes.get(asset), "shared"), 0),
  } };
}

/** Read-only, unauthenticated measurement against fixed public paths. */
export async function auditPublicRouteCss({ fetchImpl = fetch, routes = PUBLIC_ROUTES } = {}) {
  const site = new URL(ORIGIN);
  const entries = [];
  const sizes = new Map();
  // Validate and snapshot the entire inventory before any network access.
  // A later invalid entry must not permit earlier requests or duplicate rows.
  if (!Array.isArray(routes) || routes.length === 0) throw new Error("Invalid public route inventory");
  const canonicalRoutes = [...routes];
  const seenRoutes = new Set();
  for (const route of canonicalRoutes) {
    if (typeof route !== "string" || !/^\/(?!\/)/.test(route) ||
        route.includes("//") || route.includes("%") ||
        /[?#\\\s\u0000-\u001F\u007F]/u.test(route) ||
        (route !== "/" && route.endsWith("/")) ||
        route.split("/").some(segment => segment === "." || segment === "..") ||
        seenRoutes.has(route)) {
      throw new Error("Invalid public route: " + String(route));
    }
    // Require the supplied pathname to be the URL actually requested.
    if (new URL(route, site).pathname !== route) throw new Error("Invalid public route: " + route);
    seenRoutes.add(route);
  }
  async function request(url) {
    // Never permit an external hop before validating the target origin.
    const response = await fetchImpl(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
    if (response.status >= 300 && response.status < 400) throw new Error("Redirect not permitted in public route CSS audit: " + url);
    if (!response.ok) throw new Error("Public route CSS audit HTTP error at " + url);
    if (!response.url || new URL(response.url).origin !== site.origin) throw new Error("Public route CSS audit unexpected origin at " + url);
    return response;
  }
  for (const route of canonicalRoutes) {
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
