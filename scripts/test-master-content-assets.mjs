import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdtemp, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function fixture() {
  const directory = await mkdtemp(path.join(tmpdir(), 'amaana-import-assets-'));
  const suffix = randomUUID().replaceAll('-', '');
  const slugs = ['synthetic-a-' + suffix, 'synthetic-b-' + suffix];
  const categorySlug = 'synthetic-category-' + suffix;
  const master = {
    version: suffix,
    categories: [{ slug: categorySlug, title: 'Synthetic', summary: 'Synthetic', description: 'Synthetic' }],
    initiatives: slugs.map(slug => ({ slug, causeSlug: categorySlug, title: 'Synthetic', summary: 'Synthetic', story: 'Synthetic' })),
  };
  try {
    await symlink(path.join(projectRoot, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
    await copyFile(path.join(projectRoot, 'prisma/apply-master-content.mjs'), path.join(directory, 'apply-master-content.mjs'));
    await writeFile(path.join(directory, 'master-programmes.json'), JSON.stringify(master));
    await writeFile(path.join(directory, 'canonical-factual-locks.json'), JSON.stringify({ version: 1, initiatives: [] }));
    const { applyMasterContent } = await import(pathToFileURL(path.join(directory, 'apply-master-content.mjs')).href);
    return {
      slugs, categorySlug, applyMasterContent,
      asset: (slug = slugs[0], alt = 'First entry') => ({ slug, url: '/synthetic-import.jpg', alt, caption: alt, source: 'synthetic', year: 2026 }),
      writeAssets: assets => writeFile(path.join(directory, 'integration-media.json'), JSON.stringify(assets)),
      dispose: () => rm(directory, { recursive: true, force: true }),
    };
  } catch (error) {
    await rm(directory, { recursive: true, force: true });
    throw error;
  }
}

// Persistence is modeled here; actual importer JSON reads and Prisma SQL
// construction execute. The opt-in tests below verify real PostgreSQL behavior.
function model(slugs, preexisting = []) {
  const initiatives = slugs.map(slug => ({ id: 'id-' + slug, slug, financialSummary: {} }));
  const assets = preexisting.map(asset => ({ ...asset }));
  const tx = {
    $executeRaw: async () => 0,
    cause: { findUnique: async () => null, upsert: async () => ({ id: 'synthetic-cause' }), update: async () => ({}) },
    initiative: {
      findUnique: async ({ where }) => initiatives.find(record => record.slug === where.slug) ?? null,
      findMany: async ({ where }) => initiatives.filter(record => where.slug.in.includes(record.slug)),
      upsert: async ({ where }) => initiatives.find(record => record.slug === where.slug),
      updateMany: async () => ({ count: 0 }),
    },
    mediaAsset: {
      findFirst: async ({ where }) => assets.find(asset => asset.initiativeId === where.initiativeId && asset.publicUrl === where.publicUrl) ?? null,
      findMany: async ({ where }) => assets.filter(asset => where.initiativeId.in.includes(asset.initiativeId) && where.publicUrl.in.includes(asset.publicUrl)).map(asset => ({ ...asset })),
      create: async ({ data }) => { assets.push(data); return data; },
      createMany: async ({ data }) => { assets.push(...data); return { count: data.length }; },
      updateMany: async () => ({ count: 0 }),
    },
  };
  return { prisma: { $transaction: async operation => operation(tx) }, assets };
}

const scenarios = [
  ['unique input', f => [f.asset()], []],
  ['duplicate fresh input preserves first metadata and order', f => [f.asset(), f.asset(f.slugs[0], 'Later entry')], []],
  ['preexisting asset remains unchanged', f => [f.asset(), f.asset()], ['existing']],
  ['same URL on different initiatives remains distinct', f => [f.asset(), f.asset(f.slugs[1])], []],
  ['unknown initiative is skipped', f => [f.asset('unknown-synthetic-slug')], []],
  ['empty input creates no assets', () => [], []],
  ['repeated import remains idempotent', f => [f.asset(), f.asset()], [], true],
];

for (const [name, input, existing, repeat] of scenarios) {
  test(name, async () => {
    const f = await fixture();
    try {
      const preexisting = existing.length ? [{ initiativeId: 'id-' + f.slugs[0], publicUrl: '/synthetic-import.jpg', altText: 'Stored entry', sortOrder: 9 }] : [];
      const db = model(f.slugs, preexisting);
      await f.writeAssets(input(f));
      await f.applyMasterContent(db.prisma);
      if (repeat) await f.applyMasterContent(db.prisma);
      const expectedCount = name.startsWith('same URL') ? 2 : ['unknown initiative is skipped', 'empty input creates no assets'].includes(name) ? 0 : 1;
      assert.equal(db.assets.length, expectedCount);
      if (expectedCount) {
        assert.equal(db.assets[0].altText, preexisting.length ? 'Stored entry' : 'First entry');
        assert.equal(db.assets[0].sortOrder, preexisting.length ? 9 : -20);
      }
      if (expectedCount === 2) assert.notEqual(db.assets[0].initiativeId, db.assets[1].initiativeId);
    } finally { await f.dispose(); }
  });
}

for (const scoped of [false, true]) {
  test('PostgreSQL rollback-only import: ' + (scoped ? 'same URL in different initiatives' : 'duplicate fresh input'), {
    skip: process.env.AMAANA_DATABASE_TESTS !== 'true',
  }, async () => {
    const database = new URL(process.env.DATABASE_URL ?? '');
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) && database.pathname === '/amaana',
      'Importer DB tests require the isolated loopback amaana database');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const f = await fixture();
    const rollback = new Error('synthetic importer test rollback');
    try {
      await f.writeAssets([f.asset(), f.asset(scoped ? f.slugs[1] : f.slugs[0], 'Later entry')]);
      await assert.rejects(f.applyMasterContent({
        $transaction: (operation, options) => prisma.$transaction(async tx => {
          await operation(tx);
          const assets = await tx.mediaAsset.findMany({
            where: { initiative: { slug: { in: f.slugs } } }, orderBy: { sortOrder: 'asc' },
          });
          assert.equal(assets.length, scoped ? 2 : 1);
          assert.equal(assets[0].altText, 'First entry');
          assert.equal(assets[0].sortOrder, -20);
          if (scoped) assert.notEqual(assets[0].initiativeId, assets[1].initiativeId);
          throw rollback;
        }, options),
      }), error => error === rollback);
      assert.equal(await prisma.initiative.count({ where: { slug: { in: f.slugs } } }), 0);
      assert.equal(await prisma.cause.count({ where: { slug: f.categorySlug } }), 0);
    } finally {
      await prisma.$disconnect();
      await f.dispose();
    }
  });
}
