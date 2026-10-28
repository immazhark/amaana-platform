import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/** Report static assets assigned by Next.js' App Router build manifest.
 *  These are uncompressed on-disk bytes, not network transferred bytes
 *  or measured Core Web Vitals. The totals include inherited route layouts.
 */
function normalizedStaticAsset(value) {
  if (typeof value !== "string") return null;
  const normalized = value.replace(/^\/?_next\//, "").replace(/^\//, "");
  if (!/^static\/[A-Za-z0-9_./-]+\.(?:js|css)$/.test(normalized)) return null;
  if (normalized.split("/").includes("..")) return null;
  return normalized;
}

function measuredBytes(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) throw new Error(`Invalid ${label} size`);
  return value;
}

export function summarizeAppRouteBundles(pages, byteSize) {
  if (!pages || typeof pages !== "object" || Array.isArray(pages)) {
    throw new Error("Next.js app build manifest has no valid pages map");
  }
  const routePages = Object.keys(pages).filter(key => key.endsWith("/page") && Array.isArray(pages[key]));
  if (!routePages.length) throw new Error("No App Router page entries found in the build manifest");

  return routePages.map(page => {
    const parts = page.split("/").filter(Boolean);
    const inherited = ["/layout"];
    for (let index = 0; index < parts.length - 1; index += 1) {
      inherited.push(`/${parts.slice(0, index + 1).join("/")}/layout`);
    }
    const assets = new Set();
    for (const entry of [...inherited, page]) {
      for (const raw of pages[entry] ?? []) {
        const normalized = normalizedStaticAsset(raw);
        if (normalized) assets.add(normalized);
      }
    }
    const resources = [...assets].map(asset => ({ asset, bytes: measuredBytes(byteSize(asset), "bundle") }));
    const jsBytes = measuredBytes(resources.filter(item => item.asset.endsWith(".js")).reduce((n, item) => n + item.bytes, 0), "JavaScript total");
    const cssBytes = measuredBytes(resources.filter(item => item.asset.endsWith(".css")).reduce((n, item) => n + item.bytes, 0), "CSS total");
    return {
      route: page === "/page" ? "/" : page.slice(0, -"/page".length),
      entries: resources.length,
      jsBytes,
      cssBytes,
      totalBytes: measuredBytes(jsBytes + cssBytes, "route total"),
    };
  }).sort((a, b) => b.totalBytes - a.totalBytes || a.route.localeCompare(b.route));
}


/**
 * Without app-build-manifest.json, aggregate assets remain unattributed.
 * Separate client-reference evidence is reported independently for JS and CSS.
 */
export function summarizeUnattributedAppAssets(appPaths, assets) {
  if (!appPaths || typeof appPaths !== "object" || Array.isArray(appPaths)) {
    throw new Error("Next.js App Router path manifest is unavailable");
  }
  const routes = [...new Set(Object.entries(appPaths)
    .filter(([key, route]) => key.endsWith("/page") && typeof route === "string")
    .map(([, route]) => route))].sort();
  if (!routes.length) throw new Error("No App Router pages found in the path manifest");
  if (!Array.isArray(assets) || assets.some(asset => !asset || typeof asset.path !== "string" ||
      !Number.isSafeInteger(asset.bytes) || asset.bytes < 0)) {
    throw new Error("Invalid aggregate asset size or path");
  }
  const jsBytes = measuredBytes(assets.filter(asset => asset.path.endsWith(".js")).reduce((sum, asset) => sum + asset.bytes, 0), "JavaScript total");
  const cssBytes = measuredBytes(assets.filter(asset => asset.path.endsWith(".css")).reduce((sum, asset) => sum + asset.bytes, 0), "CSS total");
  return {
    metric: "unattributed-uncompressed-build-assets",
    routeAttributionAvailable: false,
    routeCount: routes.length,
    routes,
    aggregate: { jsBytes, cssBytes, totalBytes: measuredBytes(jsBytes + cssBytes, "aggregate total"), assetCount: assets.length },
  };
}

const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);

/** Parse the generated JSON assignment as data. Never execute build JavaScript. */
export function parseClientReferenceManifest(source, appPath) {
  const assignment = /^\s*globalThis\.__RSC_MANIFEST\s*=\s*globalThis\.__RSC_MANIFEST\s*\|\|\s*\{\s*\}\s*;\s*globalThis\.__RSC_MANIFEST\[("(?:\\.|[^"\\])*")\]\s*=\s*(\{[\s\S]*\})\s*;?\s*$/u.exec(source);
  if (!assignment) throw new Error("Unsupported client-reference JSON assignment");
  if (JSON.parse(assignment[1]) !== appPath) throw new Error("Client-reference page identity mismatch");
  const manifest = JSON.parse(assignment[2]);
  if (!isRecord(manifest.entryCSSFiles)) throw new Error("Client-reference CSS map is invalid");
  return manifest;
}

function validAppPage(page) {
  return /^\/[A-Za-z0-9_()[\].@/-]*page$/u.test(page) && page.endsWith("/page") &&
    !page.includes("//") && !page.split("/").includes("..");
}

/** Assigned on-disk CSS only: exclude sibling/error entries and unmeasured JS. */
export function summarizeClientReferenceCss(appPaths, readManifest, byteSize) {
  if (!isRecord(appPaths)) throw new Error("App Router path manifest is unavailable");
  const pages = Object.entries(appPaths).filter(([page, route]) => page.endsWith("/page") && typeof route === "string");
  if (!pages.length) throw new Error("No App Router page entries");
  const sizes = new Map();
  return pages.map(([page, route]) => {
    if (!validAppPage(page)) throw new Error("Unsafe App Router page path");
    const manifest = parseClientReferenceManifest(readManifest(page), page);
    const parts = page.slice(1).split("/");
    const entries = ["/layout", ...parts.slice(0, -1).map((_, index) =>
      "/" + parts.slice(0, index + 1).join("/") + "/layout"), page];
    if (page === "/_global-error/page") entries.push("/global-error");
    if (page === "/_not-found/page") entries.push("/not-found");
    const assets = new Set();
    let matchedEntries = 0;
    for (const entry of entries) {
      const keys = Object.keys(manifest.entryCSSFiles).filter(key => key.endsWith("/app" + entry));
      if (keys.length > 1) throw new Error("Ambiguous client-reference CSS entries");
      if (!keys.length) continue; // Server-only pages need not have their own CSS entry.
      matchedEntries += 1;
      const styles = manifest.entryCSSFiles[keys[0]];
      if (!Array.isArray(styles)) throw new Error("Invalid client-reference CSS entries");
      for (const style of styles) {
        if (!isRecord(style) || style.inlined !== false) throw new Error("Unsupported or inline CSS entry");
        const asset = normalizedStaticAsset(style.path);
        if (!asset || !asset.endsWith(".css")) throw new Error("Unsafe client-reference CSS asset path");
        assets.add(asset);
      }
    }
    if (!matchedEntries) throw new Error("No matching client-reference CSS entries");
    let cssBytes = 0;
    for (const asset of assets) {
      if (!sizes.has(asset)) {
        const bytes = byteSize(asset);
        if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error("Invalid CSS asset size");
        sizes.set(asset, bytes);
      }
      cssBytes += sizes.get(asset);
    }
    return { route, appPath: page, cssBytes, stylesheetCount: assets.size };
  }).sort((a, b) => b.cssBytes - a.cssBytes || a.appPath.localeCompare(b.appPath));
}

/** Next16 manifest-assigned JS, including shared runtime; not network loading. */
export function summarizeClientReferenceJs(appPaths, readManifest, rootMainFiles, byteSize) {
  if (!isRecord(appPaths)) throw new Error("App Router path manifest is unavailable");
  if (!Array.isArray(rootMainFiles)) throw new Error("Invalid shared JavaScript list");
  const pages = Object.entries(appPaths).filter(([page, route]) => page.endsWith("/page") && typeof route === "string");
  if (!pages.length) throw new Error("No App Router page entries");
  const sizes = new Map();
  const scriptPath = value => {
    const asset = normalizedStaticAsset(value);
    if (!asset || !asset.endsWith(".js")) throw new Error("Unsafe JavaScript asset path");
    return asset;
  };
  const shared = rootMainFiles.map(scriptPath);
  return pages.map(([page, route]) => {
    if (!validAppPage(page)) throw new Error("Unsafe App Router page path");
    const manifest = parseClientReferenceManifest(readManifest(page), page);
    if (!isRecord(manifest.entryJSFiles)) throw new Error("Invalid client-reference JavaScript map");
    const assets = new Set(shared);
    for (const scripts of Object.values(manifest.entryJSFiles)) {
      if (!Array.isArray(scripts)) throw new Error("Invalid client-reference JavaScript entries");
      for (const script of scripts) assets.add(scriptPath(script));
    }
    let jsBytes = 0;
    for (const asset of assets) {
      if (!sizes.has(asset)) {
        const bytes = byteSize(asset);
        if (!Number.isSafeInteger(bytes) || bytes < 0) throw new Error("Invalid JavaScript asset size");
        sizes.set(asset, bytes);
      }
      jsBytes += sizes.get(asset);
    }
    return { route, appPath: page, jsBytes, scriptCount: assets.size };
  }).sort((a, b) => b.jsBytes - a.jsBytes || a.appPath.localeCompare(b.appPath));
}

function walkBuildAssets(directory, root = directory) {
  if (!existsSync(directory)) throw new Error("Next.js static asset directory is missing");
  return readdirSync(directory, { withFileTypes: true }).flatMap(item => {
    const path = join(directory, item.name);
    if (item.isDirectory()) return walkBuildAssets(path, root);
    if (!item.isFile() || !/\.(js|css)$/.test(item.name)) return [];
    return [{ path: path.slice(root.length + 1).replaceAll("\\", "/"), bytes: statSync(path).size }];
  });
}

function run() {
  const buildDir = join(process.cwd(), ".next");
  const manifestPath = join(buildDir, "app-build-manifest.json");
  let result;
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    result = {
      metric: "manifest-assigned-uncompressed-bytes",
      routeAttributionAvailable: true,
      routes: summarizeAppRouteBundles(manifest.pages, asset => {
        const size = statSync(join(buildDir, asset)).size;
        if (!Number.isFinite(size) || size < 0) throw new Error(`Invalid bundle size: ${asset}`);
        return size;
      }),
    };
  } else {
    const routesPath = join(buildDir, "app-path-routes-manifest.json");
    if (!existsSync(routesPath)) throw new Error("App Router route path manifest missing after build");
    const appPaths = JSON.parse(readFileSync(routesPath, "utf8"));
    result = summarizeUnattributedAppAssets(appPaths, walkBuildAssets(join(buildDir, "static")));
    const pages = Object.keys(appPaths).filter(page => page.endsWith("/page"));
    // Validate before constructing any filesystem path from build metadata.
    if (pages.some(page => !validAppPage(page))) throw new Error("Unsafe App Router page path");
    const clientPath = page => join(buildDir, "server", "app", page.slice(1) + "_client-reference-manifest.js");
    result.jsRouteAttributionAvailable = false;
    result.cssRouteAttributionAvailable = pages.every(page => existsSync(clientPath(page)));
    if (result.cssRouteAttributionAvailable) {
      result.cssMetric = "client-reference-assigned-uncompressed-css-bytes";
      result.cssRoutes = summarizeClientReferenceCss(appPaths,
        page => readFileSync(clientPath(page), "utf8"), asset => statSync(join(buildDir, asset)).size);
      const buildManifestPath = join(buildDir, "build-manifest.json");
      result.jsRouteAttributionAvailable = existsSync(buildManifestPath) && pages.every(page =>
        Object.hasOwn(parseClientReferenceManifest(readFileSync(clientPath(page), "utf8"), page), "entryJSFiles"));
      if (result.jsRouteAttributionAvailable) {
        const buildManifest = JSON.parse(readFileSync(buildManifestPath, "utf8"));
        result.jsMetric = "client-reference-assigned-uncompressed-js-bytes";
        result.jsRoutes = summarizeClientReferenceJs(appPaths,
          page => readFileSync(clientPath(page), "utf8"), buildManifest.rootMainFiles,
          asset => statSync(join(buildDir, asset)).size);
      }
    }
  }
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
    return;
  }
  if (result.routeAttributionAvailable) {
    process.stdout.write(`App Router manifest attribution: ${result.routes.length} pages (uncompressed bytes)\n`);
    for (const row of result.routes.slice(0, 20)) {
      process.stdout.write(`${row.route.padEnd(46)} JS ${String(row.jsBytes).padStart(9)}  CSS ${String(row.cssBytes).padStart(9)}  assets ${row.entries}\n`);
    }
  } else {
    process.stdout.write(`App Router pages: ${result.routeCount}; legacy app-build-manifest attribution unavailable in this build.\n`);
    process.stdout.write(`Aggregate JS: ${result.aggregate.jsBytes} bytes; CSS: ${result.aggregate.cssBytes} bytes; ${result.aggregate.assetCount} files.\n`);
    process.stdout.write("Aggregate assets must not be interpreted as per-route bundle sizes.\n");
    if (result.cssRouteAttributionAvailable) {
      process.stdout.write(`Client-reference CSS attribution: ${result.cssRoutes.length} page entries (uncompressed assigned bytes).\n`);
      for (const row of result.cssRoutes.slice(0, 20)) {
        process.stdout.write(`${row.route.padEnd(46)} CSS ${String(row.cssBytes).padStart(9)}  stylesheets ${row.stylesheetCount}\n`);
      }
    } else {
      process.stdout.write("Per-route CSS attribution unavailable: client-reference manifests are incomplete.\n");
    }
    if (result.jsRouteAttributionAvailable) {
      process.stdout.write(`Client-reference JavaScript attribution: ${result.jsRoutes.length} page entries (uncompressed assigned bytes; includes shared runtime).\n`);
      for (const row of result.jsRoutes.slice(0, 20)) {
        process.stdout.write(`${row.route.padEnd(46)} JS ${String(row.jsBytes).padStart(9)}  scripts ${row.scriptCount}\n`);
      }
    } else {
      process.stdout.write("Per-route JavaScript attribution unavailable: shared build or entryJSFiles evidence is incomplete.\n");
    }
    for (const asset of walkBuildAssets(join(buildDir, "static")).filter(item => item.path.endsWith(".js")).sort((a,b) => b.bytes-a.bytes).slice(0,12)) {
      process.stdout.write(`Static JS contributor ${asset.bytes} bytes: ${asset.path}\n`);
    }
  }
  process.stdout.write("Not measured transfer size, LCP, INP, or Core Web Vitals.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(); }
  catch (error) { process.stderr.write(String(error instanceof Error ? error.message : error) + "\n"); process.exitCode = 1; }
}
