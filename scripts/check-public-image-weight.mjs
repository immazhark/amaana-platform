import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { pathToFileURL } from "node:url";

export const MAX_ARTWORK_BYTES = 400 * 1024;
const folders = ["public/hero", "public/programme-artwork"];
const types = /\.(?:webp|avif|png|jpe?g)$/i;

/** CI budget for repository hero artwork only, not consent-reviewed S3 galleries. */
export function evaluateImageWeights(files, limit = MAX_ARTWORK_BYTES) {
  if (!Number.isSafeInteger(limit) || limit <= 0) throw new Error("Invalid image weight budget");
  if (!Array.isArray(files)) throw new Error("Invalid image inventory");
  for (const file of files) {
    if (!file || typeof file.path !== "string" || !file.path.trim() ||
        !Number.isSafeInteger(file.bytes) || file.bytes < 0) {
      throw new Error("Invalid image inventory entry");
    }
  }
  const sorted = files.slice().sort((a, b) => b.bytes - a.bytes);
  const totalBytes = sorted.reduce((sum, file) => {
    const next = sum + file.bytes;
    if (!Number.isSafeInteger(next)) throw new Error("Invalid aggregate image byte size");
    return next;
  }, 0);
  return {
    imageCount: sorted.length,
    totalBytes,
    largest: sorted.slice(0, 5),
    violations: sorted.filter(file => file.bytes > limit),
  };
}

export function readHeroImageInventory(root = process.cwd()) {
  return folders.flatMap(folder => {
    const dir = join(root, folder);
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
      if (!entry.isFile() || !types.test(entry.name)) return [];
      const path = join(dir, entry.name);
      return [{ path: relative(root, path).split(sep).join("/"), bytes: statSync(path).size }];
    });
  });
}

function run() {
  const result = evaluateImageWeights(readHeroImageInventory());
  if (!result.imageCount) throw new Error("No checked-in hero/artwork raster images found");
  process.stdout.write("Static hero/artwork: " + result.imageCount +
    " images, " + (result.totalBytes / 1024 / 1024).toFixed(2) + " MiB total\n");
  for (const asset of result.largest) {
    process.stdout.write("  " + asset.path + ": " + (asset.bytes / 1024).toFixed(1) + " KiB\n");
  }
  if (result.violations.length) {
    for (const asset of result.violations) {
      process.stderr.write("Oversized (" + (MAX_ARTWORK_BYTES / 1024) + " KiB cap): " +
        asset.path + ": " + asset.bytes + " bytes\n");
    }
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { run(); }
  catch (error) {
    process.stderr.write(String(error instanceof Error ? error.message : error) + "\n");
    process.exitCode = 1;
  }
}
