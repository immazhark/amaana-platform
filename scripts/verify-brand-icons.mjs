import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const publicDir = path.join(root, "public");
const expectedPng = new Map([
  ["apple-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
]);

for (const [name, size] of expectedPng) {
  const metadata = await sharp(path.join(publicDir, name)).metadata();
  if (metadata.format !== "png" || metadata.width !== size || metadata.height !== size) {
    throw new Error(`${name} must be a ${size}x${size} PNG.`);
  }
}

const ico = await readFile(path.join(publicDir, "favicon.ico"));
if (
  ico.length <= 22 ||
  ico.readUInt16LE(0) !== 0 ||
  ico.readUInt16LE(2) !== 1 ||
  ico.readUInt16LE(4) !== 1 ||
  ico.readUInt8(6) !== 32 ||
  ico.readUInt8(7) !== 32
) {
  throw new Error("favicon.ico must contain one valid 32x32 icon image.");
}

console.log("Brand icon assets are structurally valid.");
