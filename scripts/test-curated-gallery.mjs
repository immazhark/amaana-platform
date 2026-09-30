import assert from 'node:assert/strict';
import { test } from 'node:test';
import { importCuratedGalleryDrafts } from '../prisma/curated-gallery-import.mjs';

const item = {
  id: `curated-${'a'.repeat(32)}`, slug: 'eid-gift-kits-2026', role: 'general-gallery',
  isPublic: false, privacyApprovedAt: null, heroEligible: false, sortOrder: 0,
  altText: 'Packed Eid gift kits', width: 1600, height: 1000, sha256: 'b'.repeat(64),
  storageKey: '2026/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg', publicUrl: '/media/2026/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg', sourceYear: 2026,
};
const manifest = record => ({ version: 1, batch: 'test', records: [record] });
function database({ existing = null, missing = false } = {}) {
  const writes = [];
  return { writes, $transaction: async callback => callback({
    initiative: { findUnique: async () => missing ? null : { id: 'initiative-1' } },
    mediaAsset: { findUnique: async () => existing, create: async ({ data }) => writes.push(data) },
  }) };
}
test('imports only ordered unpublished supporting media', async () => {
  const db = database();
  assert.deepEqual(await importCuratedGalleryDrafts(db, manifest(item)), { created: 1, unchanged: 0 });
  assert.equal(db.writes[0].isPublic, false);
  assert.equal(db.writes[0].privacyApprovedAt, null);
  assert.equal(db.writes[0].sortOrder, 0);
});
test('reruns do not alter existing approval, order or metadata', async () => {
  const db = database({ existing: { initiativeId: 'initiative-1', storageKey: item.storageKey, isPublic: true } });
  assert.deepEqual(await importCuratedGalleryDrafts(db, manifest(item)), { created: 0, unchanged: 1 });
  assert.equal(db.writes.length, 0);
});
test('rejects missing initiative before any writes', async () => {
  const db = database({ missing: true });
  await assert.rejects(importCuratedGalleryDrafts(db, manifest(item)), /Missing initiative/);
  assert.equal(db.writes.length, 0);
});
test('rejects publication, hero use, invalid paths and invalid dimensions', async () => {
  for (const change of [
    { isPublic: true }, { privacyApprovedAt: '2026-09-30' }, { heroEligible: true },
    { sortOrder: -1000 }, { storageKey: '../file.jpg' }, { publicUrl: 'https://example.com/image.jpg' },
    { width: 0 }, { height: 100000 }, { altText: '' }, { sha256: 'wrong' },
  ]) await assert.rejects(importCuratedGalleryDrafts(database(), manifest({ ...item, ...change })));
});
test('rejects duplicate order and conflicting existing records', async () => {
  await assert.rejects(importCuratedGalleryDrafts(database(), { version: 1, records: [item, { ...item, id: `curated-${'c'.repeat(32)}` }] }), /Duplicate initiative display order/);
  await assert.rejects(importCuratedGalleryDrafts(database({ existing: { initiativeId: 'different' } }), manifest(item)), /Existing target mismatch/);
});
