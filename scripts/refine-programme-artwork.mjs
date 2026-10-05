import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const directory = path.resolve("public/programme-artwork");
const records = [
  ["eid-diagonal-v2.webp", "eid-diagonal-v3.webp", "c3d71d6e80f36146f97fa80afe25a32865f01b71db6ab429ebcdbe1ed041ef13"],
  ["taleem-diagonal-v2.webp", "taleem-diagonal-v3.webp", "bc4c6efb659c74d34d94e13ccebf2aa4add98027a3dbf684cff88339dac6bf2f"],
  ["qurbani-diagonal-v2.webp", "qurbani-diagonal-v3.webp", "0a7e47b6b9b10ec5c88e335461c474f4627ed57b729d92ecab6cec04b21cc9aa"],
  ["winter-diagonal-v2.webp", "winter-diagonal-v3.webp", "fbe534bf2d6341360452878b6acae8fdb37b4d7741b14d6d1b88558c0484b00d"],
  ["dates-diagonal-v2.webp", "dates-diagonal-v3.webp", "55c507a14f8221b0168ee07369fa2ef9dfefd617e51d2fc08295c47e1dd87b08"],
  ["flood-diagonal-v2.webp", "flood-diagonal-v3.webp", "724169a831ff6461f443d0eec81c8f0b0c103ccc8980010acc201c64812a267b"],
];

const template = {
  width: 1536,
  height: 1024,
  seamTop: 0.494,
  seamBottom: 0.3165,
  repairRadiusRatio: 0.009,
  seamWidthRatio: 0.002,
  seam: [224, 179, 24, 255],
};

function copyPixel(target, source, channels, width, y, destinationX, sourceX) {
  const safeSourceX = Math.max(0, Math.min(width - 1, sourceX));
  const from = (y * width + safeSourceX) * channels;
  const to = (y * width + destinationX) * channels;
  for (let channel = 0; channel < channels; channel += 1) target[to + channel] = source[from + channel];
}

function paintPixel(target, channels, width, y, x, rgba) {
  const offset = (y * width + x) * channels;
  for (let channel = 0; channel < channels; channel += 1) target[offset + channel] = rgba[channel];
}

async function refine(inputName, outputName, expectedSha256) {
  const inputPath = path.join(directory, inputName);
  const outputPath = path.join(directory, outputName);
  const bytes = await readFile(inputPath);
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== expectedSha256) {
    throw new Error(`Refusing to refine ${inputName}: expected approved SHA-256 ${expectedSha256}, received ${sha256}.`);
  }

  const { data, info } = await sharp(bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== template.width || info.height !== template.height || info.channels !== 4) {
    throw new Error(`Unexpected ${inputName} geometry: ${info.width}x${info.height} with ${info.channels} channels.`);
  }

  const output = Buffer.from(data);
  const repairRadius = Math.max(8, Math.round(info.width * template.repairRadiusRatio));
  const seamWidth = Math.max(2, Math.round(info.width * template.seamWidthRatio));

  for (let y = 0; y < info.height; y += 1) {
    const progress = y / Math.max(1, info.height - 1);
    const seamRatio = template.seamTop + ((template.seamBottom - template.seamTop) * progress);
    const center = Math.round(info.width * seamRatio);
    const lineStart = center - Math.floor((seamWidth - 1) / 2);
    const lineEnd = lineStart + seamWidth - 1;
    const leftEdge = Math.max(0, center - repairRadius);
    const rightEdge = Math.min(info.width - 1, center + repairRadius);

    for (let x = leftEdge; x < lineStart; x += 1) {
      copyPixel(output, data, info.channels, info.width, y, x, leftEdge - 1 - (x - leftEdge));
    }
    for (let x = lineEnd + 1; x <= rightEdge; x += 1) {
      copyPixel(output, data, info.channels, info.width, y, x, rightEdge + 1 + (rightEdge - x));
    }
    for (let x = Math.max(0, lineStart); x <= Math.min(info.width - 1, lineEnd); x += 1) {
      paintPixel(output, info.channels, info.width, y, x, template.seam);
    }
  }

  const encoded = await sharp(output, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  }).webp({ quality: 88, smartSubsample: true, effort: 6 }).toBuffer();

  await writeFile(outputPath, encoded);
  process.stdout.write(`${outputName}: ${encoded.length} bytes (source ${bytes.length})\n`);
}

await mkdir(directory, { recursive: true });
for (const record of records) await refine(...record);
