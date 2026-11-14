import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { checkPublicMedia, validateImage, validatePublicMediaBoundaryPath } from './check-public-media.mjs';

const require = createRequire(import.meta.url);
const sharp = createRequire(require.resolve('next/package.json'))('sharp');

test('public media validation accepts real pixels and rejects corruption', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'amaana-media-check-'));
  const jpeg = await sharp({ create: { width: 32, height: 24, channels: 3, background: '#466faa' } }).jpeg().toBuffer();
  const valid = path.join(directory, 'valid.jpg');
  await writeFile(valid, jpeg);
  assert.deepEqual(await validateImage(valid), { width: 32, height: 24, format: 'jpeg' });
  const wrongExtension = path.join(directory, 'wrong.webp');
  await writeFile(wrongExtension, jpeg);
  await assert.rejects(validateImage(wrongExtension), /Expected a valid webp/);
  const corrupt = path.join(directory, 'corrupt.webp');
  await writeFile(corrupt, Buffer.alloc(14999, 0x81));
  await assert.rejects(validateImage(corrupt));
  const truncated = path.join(directory, 'truncated.jpg');
  await writeFile(truncated, jpeg.subarray(0, jpeg.length - 30));
  await assert.rejects(validateImage(truncated));
});

test('public media boundary rejects obvious private evidence and raw sensitive sources', () => {
  assert.throws(
    () => validatePublicMediaBoundaryPath('aid/case/aadhaar-card.webp'),
    /identity, banking, payment-route or medical-document/i,
  );
  assert.throws(
    () => validatePublicMediaBoundaryPath('medical/case/hospital-bill.jpg'),
    /identity, banking, payment-route or medical-document/i,
  );
  assert.throws(
    () => validatePublicMediaBoundaryPath('aid/case/patient-original.webp'),
    /raw\/original-source naming/i,
  );
  assert.throws(
    () => validatePublicMediaBoundaryPath('restricted/case/photo.webp'),
    /Private\/restricted evidence directories/i,
  );
  assert.throws(
    () => validatePublicMediaBoundaryPath('aid/case/supporting-document.pdf'),
    /belongs outside public\/media/i,
  );
  assert.throws(
    () => validatePublicMediaBoundaryPath('.DS_Store'),
    /Operating-system metadata/i,
  );
});

test('public media boundary allows reviewed derivative naming and ordinary field media', () => {
  assert.doesNotThrow(() => validatePublicMediaBoundaryPath('aid-aliza-family-message-redacted.webp'));
  assert.doesNotThrow(() => validatePublicMediaBoundaryPath('aid/auto-handover-blurred.webp'));
  assert.doesNotThrow(() => validatePublicMediaBoundaryPath('qurbani/2026/raw-meat-preparation.jpg'));
  assert.doesNotThrow(() => validatePublicMediaBoundaryPath('eid/2026/event-cover.jpg'));
  assert.doesNotThrow(() => validatePublicMediaBoundaryPath('dates/2026/preparation.mp4'));
});


test('missing public media directory is accepted as an empty library', async () => {
  const root = path.join(tmpdir(), `amaana-media-missing-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await assert.doesNotReject(checkPublicMedia(root));
});

test('public media decoder refuses symlinked root directories', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'amaana-media-root-link-'));
  try {
    const real = path.join(workspace, 'real-media');
    await mkdir(real);
    const linked = path.join(workspace, 'media');
    await symlink(real, linked);
    await assert.rejects(checkPublicMedia(linked), /symbolic link/i);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('public media decoder refuses symlinked files and nested folders', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'amaana-media-child-link-'));
  try {
    const root = path.join(workspace, 'public-media');
    const external = path.join(workspace, 'unreviewed');
    await mkdir(root);
    await mkdir(external);
    await writeFile(path.join(external, 'private.webp'), Buffer.from('SYNTHETIC_ONLY'));
    await symlink(path.join(external, 'private.webp'), path.join(root, 'linked.webp'));
    await assert.rejects(checkPublicMedia(root), /symbolic link/i);
    await rm(path.join(root, 'linked.webp'));
    await symlink(external, path.join(root, 'linked-directory'));
    await assert.rejects(checkPublicMedia(root), /symbolic link/i);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});

test('public media decoder refuses a symlinked immediate parent directory', async () => {
  const workspace = await mkdtemp(path.join(tmpdir(), 'amaana-media-parent-link-'));
  try {
    const real = path.join(workspace, 'real-public');
    await mkdir(path.join(real, 'media'), { recursive: true });
    const linked = path.join(workspace, 'public');
    await symlink(real, linked);
    await assert.rejects(checkPublicMedia(path.join(linked, 'media')), /symbolic link/i);
  } finally {
    await rm(workspace, { recursive: true, force: true });
  }
});
