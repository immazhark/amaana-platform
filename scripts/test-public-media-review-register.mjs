import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

test('reset register keeps every retained asset conservative until human review', async () => {
  const resolved = await loadAndValidatePublicMediaReviewRegister();
  const summary = publicMediaReviewSummary(resolved);
  assert.equal(summary.approved, 0);
  assert.equal(summary.pending, summary.total);
  assert.equal(summary.unknownConsent, summary.total);
  assert.equal(summary.restricted, 0);
  assert.equal(summary.blocked, 0);
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


test('missing public-media root is a valid empty inventory', async () => {
  const files = await listPublicMediaFiles('public/media-directory-that-does-not-exist');
  assert.deepEqual(files, []);
});

test('public media review inventory fails closed on symbolic links instead of omitting their targets', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'amaana-media-review-links-'));
  const outside = join(workspace, 'outside');
  const root = join(workspace, 'public', 'media');
  try {
    mkdirSync(outside, { recursive: true });
    mkdirSync(root, { recursive: true });
    writeFileSync(join(outside, 'unreviewed.webp'), 'synthetic only');
    writeFileSync(join(root, 'reviewed.webp'), 'synthetic only');

    const linkedRoot = join(workspace, 'linked-root');
    symlinkSync(outside, linkedRoot, 'dir');
    await assert.rejects(listPublicMediaFiles(linkedRoot), /Symlinked public media/);

    const linkedFile = join(root, 'unreviewed.webp');
    symlinkSync(join(outside, 'unreviewed.webp'), linkedFile);
    await assert.rejects(listPublicMediaFiles(root), /Symlinked public media/);
    rmSync(linkedFile);

    symlinkSync(outside, join(root, 'linked-folder'), 'dir');
    await assert.rejects(listPublicMediaFiles(root), /Symlinked public media/);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('public media review rejects a symlinked public parent before enumerating files', async () => {
  const workspace = mkdtempSync(join(tmpdir(), 'amaana-media-review-parent-'));
  const outside = join(workspace, 'outside');
  try {
    mkdirSync(join(outside, 'media'), { recursive: true });
    writeFileSync(join(outside, 'media', 'unreviewed.webp'), 'synthetic only');
    symlinkSync(outside, join(workspace, 'public'), 'dir');
    await assert.rejects(
      listPublicMediaFiles(join(workspace, 'public', 'media')),
      /Symlinked public media parent/,
    );
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});

test('empty inventory remains structurally valid and has no pending asset decisions', () => {
  const resolved = validatePublicMediaReviewRegister(register, []);
  assert.deepEqual(publicMediaReviewSummary(resolved), {
    total: 0,
    approved: 0,
    restricted: 0,
    pending: 0,
    blocked: 0,
    documentedProvenance: 0,
    unknownConsent: 0,
    sensitiveContext: 0,
  });
});
