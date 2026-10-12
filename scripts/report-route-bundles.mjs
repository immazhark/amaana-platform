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
    const resources = [...assets].map(asset => ({ asset, bytes: byteSize(asset) }));
    const jsBytes = resources.filter(item => item.asset.endsWith(".js")).reduce((n, item) => n + item.bytes, 0);
    const cssBytes = resources.filter(item => item.asset.endsWith(".css")).reduce((n, item) => n + item.bytes, 0);
    return {
      route: page === "/page" ? "/" : page.slice(0, -"/page".length),
      entries: resources.length,
      jsBytes,
      cssBytes,
      totalBytes: jsBytes + cssBytes,
    };
  }).sort((a, b) => b.totalBytes - a.totalBytes || a.route.localeCompare(b.route));
}


/**
 * When Next.js 16 Turbopack omits app-build-manifest.json, route-specific
 * assets cannot be attributed. Never infer a per-route budget from the total.
 */
export function summarizeUnattributedAppAssets(appPaths, assets) {
  if (!appPaths || typeof appPaths !== "object" || Array.isArray(appPaths)) {
    throw new Error("Next.js App Router path manifest is unavailable");
  }
  const routes = [...new Set(Object.entries(appPaths)
    .filter(([key, route]) => key.endsWith("/page") && typeof route === "string")
    .map(([, route]) => route))].sort();
  if (!routes.length) throw new Error("No App Router pages found in the path manifest");
  const jsBytes = assets.filter(asset => asset.path.endsWith(".js")).reduce((sum, asset) => sum + asset.bytes, 0);
  const cssBytes = assets.filter(asset => asset.path.endsWith(".css")).reduce((sum, asset) => sum + asset.bytes, 0);
  return {
    metric: "unattributed-uncompressed-build-assets",
    routeAttributionAvailable: false,
    routeCount: routes.length,
    routes,
    aggregate: { jsBytes, cssBytes, totalBytes: jsBytes + cssBytes, assetCount: assets.length },
  };
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
    result = summarizeUnattributedAppAssets(
      JSON.parse(readFileSync(routesPath, "utf8")),
      walkBuildAssets(join(buildDir, "static")),
    );
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
    process.stdout.write(`App Router pages: ${result.routeCount}; per-route asset attribution unavailable in this build.\n`);
    process.stdout.write(`Aggregate JS: ${result.aggregate.jsBytes} bytes; CSS: ${result.aggregate.cssBytes} bytes; ${result.aggregate.assetCount} files.\n`);
    process.stdout.write("Aggregate assets must not be interpreted as per-route bundle sizes.\n");
  }
  process.stdout.write("Not measured transfer size, LCP, INP, or Core Web Vitals.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(); }
  catch (error) { process.stderr.write(String(error instanceof Error ? error.message : error) + "\n"); process.exitCode = 1; }
}
