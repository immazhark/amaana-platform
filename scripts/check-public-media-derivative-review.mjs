import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sharp = createRequire(import.meta.url)('sharp');
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const formats = new Set(['jpeg', 'png', 'webp']);
const fields = new Set(['version', 'reviewRef', 'reviewedOn', 'sourceSha256', 'derivativeSha256', 'faceReview', 'metadataRemovalReviewed']);
const hashPattern = /^[a-f0-9]{64}$/;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');

// Offline preflight only. This does not inspect faces, authenticate the reviewer,
// establish consent or approve publication. Only a human can attest visual review.
export async function verifyReviewedDerivative(bytes, review, now = new Date()) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_BYTES) throw new Error('Invalid derivative size.');
  if (!review || typeof review !== 'object' || Array.isArray(review) || Object.keys(review).length !== fields.size || Object.keys(review).some(key => !fields.has(key)) || review.version !== 1) throw new Error('Invalid derivative review record.');
  if (typeof review.reviewRef !== 'string' || !/^review-[a-z0-9-]{1,64}$/.test(review.reviewRef)) throw new Error('Missing opaque review reference.');
  if (typeof review.reviewedOn !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedOn)) throw new Error('Invalid review date.');
  const day = new Date(review.reviewedOn + 'T00:00:00.000Z');
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  if (!Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== review.reviewedOn || review.reviewedOn > today) throw new Error('Invalid review date.');
  if (typeof review.sourceSha256 !== 'string' || !hashPattern.test(review.sourceSha256) || typeof review.derivativeSha256 !== 'string' || !hashPattern.test(review.derivativeSha256)) throw new Error('Invalid source or derivative digest.');
  if (digest(bytes) !== review.derivativeSha256) throw new Error('Derivative does not match reviewed bytes.');
  if (!['REDACTED_FACES_REVIEWED', 'NO_IDENTIFIABLE_FACES_REVIEWED'].includes(review.faceReview)) throw new Error('Individual human face review is required.');
  if (review.faceReview === 'REDACTED_FACES_REVIEWED' && review.sourceSha256 === review.derivativeSha256) throw new Error('Redacted derivative must differ from the source.');
  if (review.metadataRemovalReviewed !== true) throw new Error('Metadata removal review is required.');
  const options = { failOn: 'warning', limitInputPixels: MAX_PIXELS };
  let metadata;
  try { metadata = await sharp(bytes, options).metadata(); }
  catch { throw new Error('Derivative cannot be decoded.'); }
  if (!formats.has(metadata.format) || !metadata.width || !metadata.height || metadata.width * metadata.height > MAX_PIXELS || (metadata.pages ?? 1) !== 1) throw new Error('Unsupported derivative format or dimensions.');
  // Reject decoder-reported embedded profiles, text and EXIF (including GPS).
  // This is not proof that every possible nonstandard metadata payload is absent.
  if (metadata.exif != null || metadata.iptc != null || metadata.xmp != null || metadata.xmpAsString != null || metadata.icc != null || metadata.orientation != null || metadata.comments?.length) throw new Error('Derivative contains embedded metadata.');
  try { await sharp(bytes, options).raw().toBuffer(); }
  catch { throw new Error('Derivative cannot be decoded.'); }
  return { format: metadata.format, width: metadata.width, height: metadata.height };
}

async function readBounded(filename, limit) {
  const handle = await open(filename, 'r');
  try {
    const stat = await handle.stat();
    if (!stat.isFile() || stat.size > limit) throw new Error('Input must be a bounded local file.');
    const buffer = Buffer.alloc(limit + 1);
    let offset = 0;
    while (offset < buffer.length) {
      const { bytesRead } = await handle.read(buffer, offset, buffer.length - offset, offset);
      if (!bytesRead) break;
      offset += bytesRead;
    }
    if (offset > limit) throw new Error('Input exceeds the size limit.');
    return buffer.subarray(0, offset);
  } finally { await handle.close(); }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.length !== 4) throw new Error('Expected a derivative and individual review JSON.');
    const [bytes, json] = await Promise.all([readBounded(process.argv[2], MAX_BYTES), readBounded(process.argv[3], 4096)]);
    await verifyReviewedDerivative(bytes, JSON.parse(json.toString('utf8')));
    console.log('Derivative preflight passed. Not publication approval or independent proof of face redaction.');
  } catch {
    // Never print original paths, review references, digests, metadata or decoder diagnostics.
    console.error('Derivative preflight blocked. Check the local review record and exact image bytes.');
    process.exitCode = 1;
  }
}
