import assert from 'node:assert/strict';

/** Never bypass human publication review or update existing media/identity assignments. */
export async function importCuratedGalleryDrafts(prisma, manifest) {
  assert.equal(manifest.version, 1);
  assert(Array.isArray(manifest.records) && manifest.records.length > 0);
  const ids = new Set();
  const orders = new Set();
  for (const item of manifest.records) {
    assert(/^curated-[a-f0-9]{32}$/.test(item.id));
    assert(!ids.has(item.id), 'Duplicate media identity');
    ids.add(item.id);
    assert(/^[a-z0-9-]+$/.test(item.slug));
    assert.equal(item.role, 'general-gallery');
    assert.equal(item.isPublic, false);
    assert.equal(item.privacyApprovedAt, null);
    assert.equal(item.heroEligible, false);
    assert(Number.isInteger(item.sortOrder) && item.sortOrder >= 0);
    const orderKey = `${item.slug}/${item.sortOrder}`;
    assert(!orders.has(orderKey), 'Duplicate initiative display order');
    orders.add(orderKey);
    assert(typeof item.altText === 'string' && item.altText.trim() && item.altText.length <= 300);
    assert(Number.isInteger(item.width) && item.width > 0);
    assert(Number.isInteger(item.height) && item.height > 0 && item.width * item.height <= 40_000_000);
    assert(/^[a-f0-9]{64}$/.test(item.sha256));
    // Object storage is private; the existing two-segment /media proxy enforces publication.
    assert(/^\d{4}\/[0-9a-f-]{36}\.(jpg|png)$/.test(item.storageKey));
    assert.equal(item.publicUrl, `/media/${item.storageKey}`);
  }
  return prisma.$transaction(async tx => {
    const targets = new Map();
    for (const slug of new Set(manifest.records.map(item => item.slug))) {
      const target = await tx.initiative.findUnique({ where: { slug }, select: { id: true } });
      assert(target, `Missing initiative: ${slug}`);
      targets.set(slug, target.id);
    }
    let created = 0;
    for (const item of manifest.records) {
      const existing = await tx.mediaAsset.findUnique({ where: { id: item.id } });
      if (existing) {
        assert.equal(existing.initiativeId, targets.get(item.slug), 'Existing target mismatch');
        assert.equal(existing.storageKey, item.storageKey, 'Existing content mismatch');
        continue;
      }
      await tx.mediaAsset.create({ data: {
        id: item.id, initiativeId: targets.get(item.slug), kind: 'IMAGE',
        publicUrl: item.publicUrl, storageKey: item.storageKey,
        altText: item.altText, caption: item.caption || null,
        sourcePath: `owner-curated://${manifest.batch}/${item.sha256}`,
        sourceYear: item.sourceYear, width: item.width, height: item.height,
        sortOrder: item.sortOrder, isPublic: false, privacyApprovedAt: null,
      } });
      created++;
    }
    return { created, unchanged: manifest.records.length - created };
  }, { isolationLevel: 'Serializable', timeout: 120000 });
}
