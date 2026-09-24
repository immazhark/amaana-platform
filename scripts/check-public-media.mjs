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

const privateDocumentExtensions = new Set([
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.csv', '.json', '.zip', '.7z', '.rar',
]);
const privateDirectoryNames = new Set([
  'private', 'restricted', 'internal', 'proof', 'proofs', 'documents',
  'medical-records', 'medical_records', 'identity', 'banking',
]);
const privateFilenamePattern = /(?:^|[-_. ])(?:aadhaar|aadhar|passport|pan[-_ ]?card|bank[-_ ]?(?:statement|account|details)|account[-_ ]?(?:number|details)|ifsc|upi|qr[-_ ]?code|qrcode|cancelled[-_ ]?cheque|cheque|medical[-_ ]?(?:report|record)|prescription|hospital[-_ ]?bill|identity[-_ ]?card|id[-_ ]?card)(?:[-_. ]|$)/i;
const sensitiveSubjectPattern = /(?:^|[/\\_-])(?:aid|medical|patient|beneficiary|family)(?:[/\\_-]|$)/i;
const rawSourcePattern = /(?:^|[-_. ])(?:original|raw|unredacted|uncensored|source[-_ ]?scan|scan[-_ ]?copy)(?:[-_. ]|$)/i;
const operatingSystemJunk = new Set(['.ds_store', 'thumbs.db']);

export function validatePublicMediaBoundaryPath(relativePath) {
  const normalized = relativePath.split(path.sep).join('/');
  const segments = normalized.split('/').filter(Boolean);
  const basename = segments.at(-1) ?? '';
  const extension = path.extname(basename).toLowerCase();

  if (operatingSystemJunk.has(basename.toLowerCase())) {
    throw new Error('Operating-system metadata must not be committed under public/media.');
  }

  if (segments.slice(0, -1).some(segment => privateDirectoryNames.has(segment.toLowerCase()))) {
    throw new Error('Private/restricted evidence directories must not live under public/media.');
  }

  if (privateDocumentExtensions.has(extension)) {
    throw new Error(`Document/archive type ${extension} belongs outside public/media unless intentionally published through the reviewed public-documents workflow.`);
  }

  if (privateFilenamePattern.test(basename)) {
    throw new Error('Filename indicates identity, banking, payment-route or medical-document material that must remain outside public/media.');
  }

  if (sensitiveSubjectPattern.test(normalized) && rawSourcePattern.test(basename)) {
    throw new Error('Sensitive beneficiary/patient media must not expose raw/original-source naming under public/media; publish a reviewed safer derivative instead.');
  }
}

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
  let boundaryCount = 0;
  const failures = [];
  async function walk(directory) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT' && directory === root) return;
      throw error;
    }

    for (const entry of entries) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(filename);
      } else if (entry.isFile()) {
        const relative = path.relative(root, filename);
        try {
          validatePublicMediaBoundaryPath(relative);
          boundaryCount += 1;
        } catch (error) {
          failures.push(`${relative}: ${error.message}`);
          continue;
        }

        if (formats.has(path.extname(entry.name).toLowerCase())) {
          try {
            const result = await validateImage(filename);
            console.log(`OK ${relative} ${result.width}x${result.height} ${result.format}`);
            count += 1;
          } catch (error) {
            failures.push(`${relative}: ${error.message}`);
          }
        }
      }
    }
  }
  await walk(root);
  if (failures.length) throw new Error(`Invalid public media boundary:\n${failures.join('\n')}`);
  if (!count) console.log('No raster programme media is currently staged; empty media-library state accepted.');
  console.log(`Checked ${boundaryCount} public-media paths for obvious privacy-boundary violations.`);
  console.log(`Decoded ${count} public images successfully.`);
  console.log('Note: this structural gate does not replace human privacy/consent/provenance review of the media itself.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkPublicMedia(path.resolve(process.argv[2] ?? 'public/media')).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
