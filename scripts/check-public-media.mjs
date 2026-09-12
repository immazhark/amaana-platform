import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

// Resolve the decoder shipped with Next, including non-hoisted installations.
const require = createRequire(import.meta.url);
const nextRequire = createRequire(require.resolve('next/package.json'));
const sharp = nextRequire('sharp');
const formats = new Map([
  ['.jpg', 'jpeg'], ['.jpeg', 'jpeg'], ['.png', 'png'],
  ['.webp', 'webp'], ['.avif', 'avif'], ['.gif', 'gif'],
]);

export async function validateImage(filename) {
  const expected = formats.get(path.extname(filename).toLowerCase());
  if (!expected) return;
  const options = { failOn: 'warning', limitInputPixels: 40_000_000 };
  const metadata = await sharp(filename, options).metadata();
  const actual = metadata.format === 'heif' && metadata.compression === 'av1' ? 'avif' : metadata.format;
  if (actual !== expected || !metadata.width || !metadata.height) {
    throw new Error(`Expected a valid ${expected} image, received ${actual ?? 'unknown format'}`);
  }
  // Header-only checks can accept truncated images. Force complete pixel decoding.
  await sharp(filename, options).raw().toBuffer();
  return { width: metadata.width, height: metadata.height, format: actual };
}

export async function checkPublicMedia(root) {
  let count = 0;
  const failures = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(filename);
      else if (entry.isFile() && formats.has(path.extname(entry.name).toLowerCase())) {
        try {
          const result = await validateImage(filename);
          console.log(`OK ${path.relative(root, filename)} ${result.width}x${result.height} ${result.format}`);
          count += 1;
        } catch (error) {
          failures.push(`${path.relative(root, filename)}: ${error.message}`);
        }
      }
    }
  }
  await walk(root);
  if (failures.length) throw new Error(`Invalid public media:\n${failures.join('\n')}`);
  if (!count) throw new Error('No raster media found; check the public media directory.');
  console.log(`Decoded ${count} public images successfully.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPublicMedia(path.resolve(process.argv[2] ?? 'public')).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

