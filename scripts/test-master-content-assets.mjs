import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { copyFile, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

async function fixture({ stripTimestamps = false } = {}) {
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
    const sourceFile = path.join(projectRoot, 'prisma/apply-master-content.mjs');
    const importerFile = path.join(directory, 'apply-master-content.mjs');
    if (stripTimestamps) {
      // Controlled counterexample in a temporary copy, never the repo/runtime.
      const source = await readFile(sourceFile, 'utf8');
      const assignment = ', "updatedAt" = (clock_timestamp() AT TIME ZONE \'UTC\')';
      assert.equal(source.split(assignment).length - 1, 4);
      await writeFile(importerFile, source.replaceAll(assignment, ''));
    } else {
      await copyFile(sourceFile, importerFile);
    }
    await writeFile(path.join(directory, 'master-programmes.json'), JSON.stringify(master));
    await writeFile(path.join(directory, 'canonical-factual-locks.json'), JSON.stringify({ version: 1, initiatives: [] }));
    const { applyMasterContent } = await import(pathToFileURL(path.join(directory, 'apply-master-content.mjs')).href);
    return {
      slugs, categorySlug, version: suffix, applyMasterContent,
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

for (const fastPath of [false, true]) {
  test('PostgreSQL legacy timestamp parity: ' + (fastPath ? 'version-marker fast path' : 'full import'), {
    skip: process.env.AMAANA_DATABASE_TESTS !== 'true',
  }, async () => {
    const database = new URL(process.env.DATABASE_URL ?? '');
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(database.hostname) && database.pathname === '/amaana',
      'Importer DB tests require the isolated loopback amaana database');
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const categorySlugs = ['education-support', 'amaana-taleem'];
    const markerSlug = 'auto-rickshaw-livelihood-support';
    const categorySnapshot = () => prisma.cause.findMany({ where: { slug: { in: categorySlugs } }, orderBy: { slug: 'asc' } });
    const markerSnapshot = () => prisma.initiative.findUnique({ where: { slug: markerSlug } });
    const oldDate = new Date('2000-01-01T00:00:00Z');
    try {
      const categoriesBefore = await categorySnapshot();
      const markerBefore = await markerSnapshot();
      for (const stripTimestamps of [true, false]) {
        const f = await fixture({ stripTimestamps });
        const rollback = new Error('synthetic timestamp test rollback');
        const suffix = f.version;
        const legacySlug = 'legacy-' + suffix;
        const unaffectedSlug = 'unaffected-' + suffix;
        try {
          await f.writeAssets([]);
          await assert.rejects(f.applyMasterContent({
            $transaction: (operation, options) => prisma.$transaction(async tx => {
              await tx.$executeRaw`SET LOCAL TIME ZONE 'Asia/Kolkata'`;
              const categoryData = { title: 'Synthetic', summary: 'Synthetic', description: 'Synthetic', status: 'PUBLISHED', updatedAt: oldDate };
              const legacy = await tx.cause.upsert({ where: { slug: categorySlugs[0] }, create: { slug: categorySlugs[0], ...categoryData }, update: categoryData });
              const target = await tx.cause.upsert({ where: { slug: categorySlugs[1] }, create: { slug: categorySlugs[1], ...categoryData }, update: categoryData });
              const user = await tx.user.create({ data: { name: 'Synthetic', email: suffix + '@example.test' } });
              const initiative = await tx.initiative.create({ data: { slug: legacySlug, title: 'Synthetic', summary: 'Synthetic', story: 'Synthetic', causeId: legacy.id, updatedAt: oldDate } });
              const story = await tx.story.create({ data: { slug: legacySlug, title: 'Synthetic', summary: 'Synthetic', body: 'Synthetic', causeId: legacy.id, initiativeId: initiative.id, updatedAt: oldDate } });
              const appeal = await tx.appeal.create({ data: { slug: legacySlug, title: 'Synthetic', summary: 'Synthetic', story: 'Synthetic', category: 'MEDICAL', beneficiaryName: 'Synthetic', goalAmount: 1000, createdById: user.id, causeId: legacy.id, initiativeId: initiative.id, updatedAt: oldDate } });
              const unaffected = await tx.initiative.create({ data: { slug: unaffectedSlug, title: 'Synthetic', summary: 'Synthetic', story: 'Synthetic', causeId: target.id, updatedAt: oldDate } });
              if (fastPath) await tx.initiative.upsert({
                where: { slug: markerSlug },
                create: { slug: markerSlug, title: 'Synthetic', summary: 'Synthetic', story: 'Synthetic', causeId: target.id, financialSummary: { contentVersion: f.version } },
                update: { financialSummary: { contentVersion: f.version } },
              });
              const [{ time: before }] = await tx.$queryRaw`SELECT clock_timestamp() AS time`;
              assert.equal(await operation(tx), fastPath ? 0 : 2);
              const [{ time: after }] = await tx.$queryRaw`SELECT clock_timestamp() AS time`;
              const records = [
                await tx.cause.findUniqueOrThrow({ where: { id: legacy.id } }),
                await tx.initiative.findUniqueOrThrow({ where: { id: initiative.id } }),
                await tx.story.findUniqueOrThrow({ where: { id: story.id } }),
                await tx.appeal.findUniqueOrThrow({ where: { id: appeal.id } }),
              ];
              assert.equal(records[0].status, 'ARCHIVED');
              for (const record of records.slice(1)) assert.equal(record.causeId, target.id);
              for (const record of records) {
                if (stripTimestamps) assert.equal(record.updatedAt.getTime(), oldDate.getTime());
                else {
                  assert.ok(record.updatedAt.getTime() > oldDate.getTime());
                  // TIMESTAMP(3) rounds sub-millisecond database clock values.
                  assert.ok(record.updatedAt.getTime() >= before.getTime() - 1 && record.updatedAt.getTime() <= after.getTime() + 1);
                }
              }
              const control = await tx.initiative.findUniqueOrThrow({ where: { id: unaffected.id } });
              assert.equal(control.causeId, target.id);
              assert.equal(control.updatedAt.getTime(), oldDate.getTime());
              throw rollback;
            }, options),
          }), error => error === rollback);
          assert.deepEqual(await categorySnapshot(), categoriesBefore);
          assert.deepEqual(await markerSnapshot(), markerBefore);
          assert.equal(await prisma.initiative.count({ where: { slug: { in: [...f.slugs, legacySlug, unaffectedSlug] } } }), 0);
          assert.equal(await prisma.story.count({ where: { slug: legacySlug } }), 0);
          assert.equal(await prisma.appeal.count({ where: { slug: legacySlug } }), 0);
          assert.equal(await prisma.user.count({ where: { email: suffix + '@example.test' } }), 0);
          assert.equal(await prisma.cause.count({ where: { slug: f.categorySlug } }), 0);
        } finally { await f.dispose(); }
      }
    } finally { await prisma.$disconnect(); }
  });
}
