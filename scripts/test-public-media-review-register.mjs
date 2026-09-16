import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  listPublicMediaFiles,
  loadAndValidatePublicMediaReviewRegister,
  publicMediaReviewSummary,
  validatePublicMediaReviewRegister,
} from './check-public-media-review-register.mjs';

const register = JSON.parse(await readFile('docs/public-media-review-register.json', 'utf8'));
const assetPaths = await listPublicMediaFiles('public/media');

test('every directly addressable public media file has exactly one conservative review classification', () => {
  const resolved = validatePublicMediaReviewRegister(register, assetPaths);
  assert.equal(resolved.length, assetPaths.length);
  assert.deepEqual(resolved.map(item => item.path).sort(), assetPaths);
});

test('legacy register does not infer human approval or consent from existing publication', async () => {
  const resolved = await loadAndValidatePublicMediaReviewRegister();
  const summary = publicMediaReviewSummary(resolved);
  assert.equal(summary.approved, 0);
  assert.equal(summary.pending, summary.total);
  assert.equal(summary.unknownConsent, summary.total);
  assert.ok(summary.documentedProvenance > 0, 'known provenance records should remain distinguishable from privacy approval');
});

test('approval claims fail closed without reviewer, date, documented provenance and usable consent', () => {
  const sample = {
    version: 1,
    groups: [{
      id: 'sample', pattern: '^sample\\.webp$', humanReview: 'REVIEWED_APPROVED',
      provenance: 'PARTIAL', consent: 'UNKNOWN', sensitiveContext: true,
    }],
    overrides: [],
  };
  assert.throws(
    () => validatePublicMediaReviewRegister(sample, ['sample.webp']),
    /without reviewer and review date/,
  );
});

test('unregistered media and ambiguous coverage both fail closed', () => {
  const missing = { version: 1, groups: [{ id: 'known', pattern: '^known-', humanReview: 'PENDING_HUMAN_REVIEW', provenance: 'UNKNOWN', consent: 'UNKNOWN' }], overrides: [] };
  assert.throws(() => validatePublicMediaReviewRegister(missing, ['other.webp']), /matched none/);

  const ambiguous = { version: 1, groups: [
    { id: 'one', pattern: '^same-', humanReview: 'PENDING_HUMAN_REVIEW', provenance: 'UNKNOWN', consent: 'UNKNOWN' },
    { id: 'two', pattern: 'same', humanReview: 'PENDING_HUMAN_REVIEW', provenance: 'UNKNOWN', consent: 'UNKNOWN' },
  ], overrides: [] };
  assert.throws(() => validatePublicMediaReviewRegister(ambiguous, ['same-file.webp']), /matched one, two/);
});

test('review register rejects sensitive-detail fields even when coverage is otherwise valid', () => {
  const unsafe = {
    version: 1,
    groups: [{ id: 'sample', pattern: '^sample', humanReview: 'PENDING_HUMAN_REVIEW', provenance: 'UNKNOWN', consent: 'UNKNOWN', beneficiaryName: 'Do not store this here' }],
    overrides: [],
  };
  assert.throws(() => validatePublicMediaReviewRegister(unsafe, ['sample.webp']), /forbidden sensitive-detail field beneficiaryName/);
});
