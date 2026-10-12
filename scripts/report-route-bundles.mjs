import { readFileSync, statSync } from "node:fs";
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

function run() {
  const buildDir = join(process.cwd(), ".next");
  const manifest = JSON.parse(readFileSync(join(buildDir, "app-build-manifest.json"), "utf8"));
  const data = summarizeAppRouteBundles(manifest.pages, asset => {
    const bytes = statSync(join(buildDir, asset)).size;
    if (!Number.isFinite(bytes) || bytes < 0) throw new Error(`Invalid bundle size: ${asset}`);
    return bytes;
  });
  if (process.argv.includes("--json")) {
    process.stdout.write(JSON.stringify({ metric: "manifest-assigned-uncompressed-bytes", routes: data }, null, 2) + "\n");
    return;
  }
  process.stdout.write(`App Router bundle assignment: ${data.length} pages (uncompressed, manifest-listed assets)\n`);
  for (const row of data.slice(0, 20)) {
    process.stdout.write(`${row.route.padEnd(46)} JS ${String(row.jsBytes).padStart(9)}  CSS ${String(row.cssBytes).padStart(9)}  assets ${row.entries}\n`);
  }
  process.stdout.write("These are manifest assignments, not measured network transfers or per-route performance scores.\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(); }
  catch (error) { process.stderr.write(String(error instanceof Error ? error.message : error) + "\n"); process.exitCode = 1; }
}
