import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import test from 'node:test';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { verifyReviewedDerivative } from './check-public-media-derivative-review.mjs';

const sharp = createRequire(import.meta.url)('sharp');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const image = () => sharp({ create: { width: 16, height: 16, channels: 3, background: '#466faa' } });
const clean = await image().webp().toBuffer();
const review = (bytes = clean, patch = {}) => ({
  version: 1, reviewRef: 'review-synthetic-01', reviewedOn: '2026-01-15',
  sourceSha256: 'a'.repeat(64), derivativeSha256: digest(bytes),
  faceReview: 'REDACTED_FACES_REVIEWED', metadataRemovalReviewed: true, ...patch,
});

test('accepts byte-bound human review and decoded clean synthetic image', async () => {
  assert.deepEqual(await verifyReviewedDerivative(clean, review()), { format: 'webp', width: 16, height: 16 });
  assert.deepEqual(await verifyReviewedDerivative(clean, review(clean, { faceReview: 'NO_IDENTIFIABLE_FACES_REVIEWED', sourceSha256: digest(clean) })), { format: 'webp', width: 16, height: 16 });
  for (const format of ['jpeg', 'png']) {
    const bytes = await image()[format]().toBuffer();
    assert.deepEqual(await verifyReviewedDerivative(bytes, review(bytes)), { format, width: 16, height: 16 });
  }
});

test('rejects consent-only, unreviewed, malformed, stale and substituted proof', async () => {
  for (const patch of [
    { faceReview: undefined }, { faceReview: 'CONSENT_DOCUMENTED' },
    { metadataRemovalReviewed: false }, { metadataRemovalReviewed: 'true' },
    { derivativeSha256: 'b'.repeat(64) }, { sourceSha256: digest(clean) },
    { reviewedOn: '2026-02-30' }, { reviewedOn: '9999-01-01' },
    { reviewRef: '' }, { reviewRef: 'private name@example.invalid' }, { beneficiaryName: 'synthetic' },
  ]) await assert.rejects(verifyReviewedDerivative(clean, review(clean, patch)));
  await assert.rejects(verifyReviewedDerivative(clean, { consentStatus: 'DOCUMENTED' }));
});

test('rejects actual EXIF GPS and embedded metadata even with matching review hash', async () => {
  const exif = await image().jpeg().withExif({ IFD0: { Artist: 'SYNTHETIC' }, IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '1/1 2/1 3/1' } }).toBuffer();
  assert.ok((await sharp(exif).metadata()).exif);
  await assert.rejects(verifyReviewedDerivative(exif, review(exif)), /embedded metadata/i);
  const profile = await image().png().withIccProfile('srgb').toBuffer();
  assert.ok((await sharp(profile).metadata()).icc);
  await assert.rejects(verifyReviewedDerivative(profile, review(profile)), /embedded metadata/i);
});

test('rejects undecodable or out-of-scope images and oversize bytes', async () => {
  for (const bytes of [Buffer.from('not an image'), clean.subarray(0, clean.length - 12), await image().gif().toBuffer(), Buffer.alloc(5 * 1024 * 1024 + 1)]) {
    await assert.rejects(verifyReviewedDerivative(bytes, review(bytes)));
  }
});


test('enforces the review date at the Indian calendar-day boundary', async () => {
  const record = review(clean, { reviewedOn: '2026-01-16' });
  await assert.rejects(verifyReviewedDerivative(clean, record, new Date('2026-01-15T18:29:59Z')), /review date/i);
  await assert.doesNotReject(verifyReviewedDerivative(clean, record, new Date('2026-01-15T18:30:00Z')));
});

test('CLI reports only generic results and refuses substituted bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'amaana-derivative-review-'));
  try {
    const derivative = join(dir, 'SYNTHETIC_PRIVATE_PATH.webp');
    const record = join(dir, 'SYNTHETIC_PRIVATE_REVIEW.json');
    const cli = fileURLToPath(new URL('./check-public-media-derivative-review.mjs', import.meta.url));
    await writeFile(derivative, clean);
    await writeFile(record, JSON.stringify(review()));
    const run = () => spawnSync(process.execPath, [cli, derivative, record], { encoding: 'utf8' });
    const pass = run();
    assert.equal(pass.status, 0, pass.stderr);
    assert.match(pass.stdout, /Not publication approval/);
    await writeFile(derivative, Buffer.from('SYNTHETIC_PRIVATE_CONTENT'));
    const blocked = run();
    assert.equal(blocked.status, 1);
    assert.match(blocked.stderr, /Derivative preflight blocked/);
    assert.doesNotMatch(blocked.stdout + blocked.stderr, /SYNTHETIC_PRIVATE|review-synthetic-01|[a-f0-9]{64}/);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
