import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sources = [
  { directory: path.resolve("public/programme-artwork"), provenance: "provenance.json", include: () => true },
  { directory: path.resolve("public/hero"), provenance: "provenance.json", include: record => record.name === "origin" },
];

const records = [];
for (const source of sources) {
  const provenancePath = path.join(source.directory, source.provenance);
  const provenance = JSON.parse(await readFile(provenancePath, "utf8"));
  for (const record of provenance.records.filter(source.include)) {
    if (!record.output || !record.refinedOutput || !record.sha256) {
      throw new Error(`Incomplete artwork provenance for ${record.name ?? "unknown record"}.`);
    }
    records.push({
      directory: source.directory,
      inputName: path.basename(record.output),
      outputName: path.basename(record.refinedOutput),
      expectedSha256: record.sha256,
    });
  }
}

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

async function refine({ directory, inputName, outputName, expectedSha256 }) {
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

  await mkdir(directory, { recursive: true });
  await writeFile(outputPath, encoded);
  process.stdout.write(`${path.relative(process.cwd(), outputPath)}: ${encoded.length} bytes (source ${bytes.length})\n`);
}

for (const record of records) await refine(record);
