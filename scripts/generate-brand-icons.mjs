import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "src/app/icon.svg");
const publicDir = path.join(root, "public");
const source = await readFile(sourcePath);

await mkdir(publicDir, { recursive: true });

async function png(size, options = {}) {
  return sharp(source)
    .resize(size, size, {
      fit: "contain",
      background: options.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
}

function singlePngIco(image, size) {
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  header.writeUInt8(size === 256 ? 0 : size, 6);
  header.writeUInt8(size === 256 ? 0 : size, 7);
  header.writeUInt8(0, 8);
  header.writeUInt8(0, 9);
  header.writeUInt16LE(1, 10);
  header.writeUInt16LE(32, 12);
  header.writeUInt32LE(image.length, 14);
  header.writeUInt32LE(header.length, 18);
  return Buffer.concat([header, image]);
}

const faviconPng = await png(32);
await Promise.all([
  writeFile(path.join(publicDir, "favicon.ico"), singlePngIco(faviconPng, 32)),
  png(180).then(buffer => writeFile(path.join(publicDir, "apple-icon.png"), buffer)),
  png(192).then(buffer => writeFile(path.join(publicDir, "icon-192.png"), buffer)),
  png(512).then(buffer => writeFile(path.join(publicDir, "icon-512.png"), buffer)),
  sharp(source)
    .resize(384, 384, { fit: "contain", background: "#fffdf8" })
    .extend({ top: 64, bottom: 64, left: 64, right: 64, background: "#fffdf8" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(publicDir, "icon-maskable-512.png")),
]);

console.log("Generated branded favicon, Apple touch icon and PWA icons.");
