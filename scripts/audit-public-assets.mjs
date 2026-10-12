#!/usr/bin/env node
/**
 * Conservative public-asset inventory. Read-only by design: an absent literal
 * reference is NOT proof that a file is unused (DB/CMS and computed URLs exist).
 *
 * Run: node scripts/audit-public-assets.mjs
 * Optional: node scripts/audit-public-assets.mjs --json
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const publicRoot = path.join(root, "public");
const indexRoots = ["src", "prisma", "scripts", "e2e", "public"];
const indexExtensions = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".json", ".md", ".mdx", ".html", ".svg", ".xml", ".txt", ".yml", ".yaml"]);
const assetExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".avif", ".gif", ".svg", ".ico", ".mp4", ".webm", ".mov", ".pdf", ".woff", ".woff2", ".ttf", ".otf"]);
const protectedPrefixes = ["backgrounds/", "programme-artwork/", "hero/", "brand/"];
const protectedNames = new Set(["favicon.ico", "apple-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "robots.txt", "sitemap.xml", "manifest.webmanifest"]);
const omitDirs = new Set(["node_modules", ".next", ".git", "coverage", "out", ".curated-media"]);

async function walk(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === "ENOENT") return []; throw error; }
  const files = [];
  for (const entry of entries) {
    if (omitDirs.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(full));
    else if (entry.isFile()) files.push(full);
  }
  return files;
}

const assetFiles = (await walk(publicRoot)).filter(file => {
  const relative = path.relative(publicRoot, file).split(path.sep).join("/");
  return assetExtensions.has(path.extname(file).toLowerCase()) || protectedNames.has(relative);
});
const sourceFiles = (await Promise.all(indexRoots.map(dir => walk(path.join(root, dir)))))
  .flat().filter(file => indexExtensions.has(path.extname(file).toLowerCase()));
const contents = [];
for (const file of sourceFiles) {
  // Image/SVG internals aren't a consumer reference; JSON provenance *is*.
  if (assetExtensions.has(path.extname(file).toLowerCase()) && path.extname(file).toLowerCase() !== ".svg") continue;
  if (file === path.join(root, "scripts", "audit-public-assets.mjs")) continue;
  const size = (await stat(file)).size;
  if (size > 5_000_000) continue;
  contents.push({ file, text: await readFile(file, "utf8") });
}

const pathCharacter = /[A-Za-z0-9._~!  contents.push(await readFile(file, "utf8"));
}
const corpus = contents.join("\n");
const rows = assetFiles.map(file => {
  const relative = path.relative(publicRoot, file).split(path.sep).join("/");
  const candidates = ["/" + relative, "public/" + relative, encodeURI("/" + relative), encodeURIComponent(relative)];
  const literal = candidates.some(value => corpus.includes(value));
'()*+,;=:@%/-]/;
function hasCompleteReference(text, candidate) {
  let offset = 0;
  while (offset <= text.length - candidate.length) {
    const index = text.indexOf(candidate, offset);
    if (index < 0) return false;
    const before = index > 0 ? text[index - 1] : "";
    const after = text[index + candidate.length] ?? "";
    const leadingBoundary = candidate.startsWith("/") || !before || !pathCharacter.test(before);
    const trailingBoundary = !after || !pathCharacter.test(after);
    if (leadingBoundary && trailingBoundary) return true;
    offset = index + 1;
  }
  return false;
}

const rows = assetFiles.map(file => {
  const relative = path.relative(publicRoot, file).split(path.sep).join("/");
  const publicPath = "/" + relative;
  const candidates = [...new Set([
    publicPath,
    "public/" + relative,
    encodeURI(publicPath),
    encodeURIComponent(publicPath),
  ])];
  const literal = contents.some(source =>
    source.file !== file && candidates.some(value => hasCompleteReference(source.text, value))
  );
  const protectedAsset = protectedPrefixes.some(prefix => relative.startsWith(prefix))
    || protectedNames.has(relative);
  return { asset: relative, status: literal ? "referenced" : protectedAsset ? "protected" : "unresolved" };
}).sort((a,b) => a.asset.localeCompare(b.asset));
const counts = Object.fromEntries(["referenced", "protected", "unresolved"].map(status => [status, rows.filter(row => row.status === status).length]));
if (process.argv.includes("--json")) console.log(JSON.stringify({ counts, rows }, null, 2));
else {
  console.log("Public asset reference inventory:", JSON.stringify(counts));
  for (const row of rows.filter(row => row.status !== "referenced")) console.log(row.status.padEnd(11), row.asset);
  console.log("Read-only. 'unresolved' requires manual checking of DB/CMS, manifests, computed URLs, and deployed media before deletion.");
}
