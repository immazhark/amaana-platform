import { Prisma } from '@prisma/client';
import { readFile } from 'node:fs/promises';

const LEGACY_CATEGORY_TARGETS = {
  'seasonal-food-support': 'ramadan-eid',
  education: 'amaana-taleem',
  'education-support': 'amaana-taleem',
  'medical-financial-assistance': 'medical-financial-relief',
  'emergency-relief': 'emergency-humanitarian-relief',
  'seasonal-support': 'seasonal-relief',
};

async function readJson(relativePath) {
  return JSON.parse(await readFile(new URL(relativePath, import.meta.url), 'utf8'));
}

function replaceLockedText(value, replacements = []) {
  if (!value) return value;
  return replacements.reduce(
    (current, replacement) => current.replaceAll(replacement.from, replacement.to),
    value,
  );
}

function factualLockData(locksVersion, lock, existing) {
  return {
    primaryMetric: lock.primaryMetric ?? existing.primaryMetric,
    primaryMetricLabel: lock.primaryMetricLabel ?? existing.primaryMetricLabel,
    summary: lock.summary ?? replaceLockedText(existing.summary, lock.textReplacements),
    story: lock.story ?? replaceLockedText(existing.story, lock.textReplacements),
    financialSummary: {
      ...(existing.financialSummary || {}),
      factualLockVersion: locksVersion,
      ...(Object.prototype.hasOwnProperty.call(lock, 'facts') ? { facts: lock.facts } : {}),
      ...(Object.prototype.hasOwnProperty.call(lock, 'dataCaveat')
        ? { dataCaveat: lock.dataCaveat }
        : {}),
    },
  };
}

async function applyCanonicalFactualLocks(tx, locks) {
  const targets = locks.initiatives.flatMap((lock) => [
    { lock, slug: lock.slug },
    ...(lock.legacySlugs || []).map((slug) => ({ lock, slug })),
  ]);
  const existingRecords = await tx.initiative.findMany({
    where: { slug: { in: targets.map((target) => target.slug) } },
  });
  const existingBySlug = new Map(existingRecords.map((record) => [record.slug, record]));

  await Promise.all(
    targets.flatMap(({ lock, slug }) => {
      const existing = existingBySlug.get(slug);
      if (!existing) return [];
      return [tx.initiative.update({
        where: { id: existing.id },
        data: factualLockData(locks.version, lock, existing),
      })];
    }),
  );
}

async function reconcileLegacyCategories(tx) {
  const mappingValues = Prisma.join(
    Object.entries(LEGACY_CATEGORY_TARGETS).map(([oldSlug, targetSlug]) =>
      Prisma.sql`(${oldSlug}, ${targetSlug})`,
    ),
  );

  await tx.$executeRaw(Prisma.sql`
    WITH mapping("oldSlug", "targetSlug") AS (VALUES ${mappingValues})
    UPDATE "Initiative" AS record
    SET "causeId" = target.id
    FROM mapping
    JOIN "Cause" AS legacy ON legacy.slug = mapping."oldSlug"
    JOIN "Cause" AS target ON target.slug = mapping."targetSlug"
    WHERE record."causeId" = legacy.id
      AND legacy.id <> target.id
  `);

  await tx.$executeRaw(Prisma.sql`
    WITH mapping("oldSlug", "targetSlug") AS (VALUES ${mappingValues})
    UPDATE "Appeal" AS record
    SET "causeId" = target.id
    FROM mapping
    JOIN "Cause" AS legacy ON legacy.slug = mapping."oldSlug"
    JOIN "Cause" AS target ON target.slug = mapping."targetSlug"
    WHERE record."causeId" = legacy.id
      AND legacy.id <> target.id
  `);

  await tx.$executeRaw(Prisma.sql`
    WITH mapping("oldSlug", "targetSlug") AS (VALUES ${mappingValues})
    UPDATE "Story" AS record
    SET "causeId" = target.id
    FROM mapping
    JOIN "Cause" AS legacy ON legacy.slug = mapping."oldSlug"
    JOIN "Cause" AS target ON target.slug = mapping."targetSlug"
    WHERE record."causeId" = legacy.id
      AND legacy.id <> target.id
  `);

  await tx.$executeRaw(Prisma.sql`
    WITH mapping("oldSlug", "targetSlug") AS (VALUES ${mappingValues})
    UPDATE "Cause" AS legacy
    SET status = 'ARCHIVED'
    FROM mapping
    JOIN "Cause" AS target ON target.slug = mapping."targetSlug"
    WHERE legacy.slug = mapping."oldSlug"
      AND legacy.id <> target.id
  `);
}

export async function applyMasterContent(prisma) {
  const master = await readJson('./master-programmes.json');
  const factualLocks = await readJson('./canonical-factual-locks.json');

  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091501)`;

      const marker = await tx.initiative.findUnique({
        where: { slug: 'auto-rickshaw-livelihood-support' },
      });

      if (marker?.financialSummary?.contentVersion === master.version) {
        await reconcileLegacyCategories(tx);
        await applyCanonicalFactualLocks(tx, factualLocks);
        return 0;
      }

      const ids = new Map();
      for (const category of master.categories) {
        const row = await tx.cause.upsert({
          where: { slug: category.slug },
          create: { ...category, status: 'PUBLISHED', publishedAt: new Date() },
          update: category,
        });
        ids.set(category.slug, row.id);
      }

      const existingInitiatives = await tx.initiative.findMany({
        where: { slug: { in: master.initiatives.map((record) => record.slug) } },
        select: { slug: true, financialSummary: true },
      });
      const existingInitiativeBySlug = new Map(existingInitiatives.map((record) => [record.slug, record]));

      for (const [displayOrder, record] of master.initiatives.entries()) {
        const { causeSlug, parentSlug, programmeStatus, facts, dataCaveat, ...copy } = record;
        const existing = existingInitiativeBySlug.get(copy.slug);
        const data = {
          ...copy,
          causeId: ids.get(causeSlug),
          displayOrder,
          isFeatured: !parentSlug,
          financialSummary: {
            ...(existing?.financialSummary || {}),
            contentVersion: master.version,
            parentSlug: parentSlug || null,
            programmeStatus,
            facts: facts || [],
            dataCaveat: dataCaveat || null,
          },
        };
        await tx.initiative.upsert({
          where: { slug: copy.slug },
          create: { ...data, status: 'PUBLISHED', publishedAt: new Date() },
          update: data,
        });
      }

      await reconcileLegacyCategories(tx);

      const canonicalWinter = master.initiatives.find((item) => item.slug === 'winter-relief');
      await tx.initiative.updateMany({
        where: { slug: { in: ['winter-drive-2025-26', 'winter-relief-2025-26'] } },
        data: {
          causeId: ids.get('seasonal-relief'),
          summary: canonicalWinter?.summary,
          story: canonicalWinter?.story,
        },
      });

      const winterRecords = await tx.initiative.findMany({
        where: { slug: { in: ['winter-relief', 'winter-drive-2025-26', 'winter-relief-2025-26'] } },
        select: { id: true, slug: true },
      });
      const winter = winterRecords.find((record) => record.slug === 'winter-relief');
      const legacyWinterIds = winterRecords
        .filter((record) => record.slug !== 'winter-relief')
        .map((record) => record.id);
      if (winter && legacyWinterIds.length) {
        await tx.mediaAsset.updateMany({
          where: { initiativeId: { in: legacyWinterIds } },
          data: { initiativeId: winter.id },
        });
      }

      const assets = await readJson('./integration-media.json');
      const assetSlugs = [...new Set(assets.map((asset) => asset.slug))];
      const assetInitiatives = await tx.initiative.findMany({
        where: { slug: { in: assetSlugs } },
        select: { id: true, slug: true },
      });
      const assetInitiativeBySlug = new Map(assetInitiatives.map((record) => [record.slug, record.id]));
      const initiativeIds = assetInitiatives.map((record) => record.id);
      const assetUrls = [...new Set(assets.map((asset) => asset.url))];
      const existingAssets = initiativeIds.length && assetUrls.length
        ? await tx.mediaAsset.findMany({
            where: {
              initiativeId: { in: initiativeIds },
              publicUrl: { in: assetUrls },
            },
            select: { initiativeId: true, publicUrl: true },
          })
        : [];
      const existingAssetKeys = new Set(
        existingAssets.map((asset) => `${asset.initiativeId}\u0000${asset.publicUrl}`),
      );
      const privacyApprovedAt = new Date();
      const missingAssets = assets.flatMap((asset, sortIndex) => {
        const initiativeId = assetInitiativeBySlug.get(asset.slug);
        if (!initiativeId || existingAssetKeys.has(`${initiativeId}\u0000${asset.url}`)) return [];
        return [{
          initiativeId,
          kind: 'IMAGE',
          publicUrl: asset.url,
          title: asset.alt,
          altText: asset.alt,
          caption: asset.caption,
          sourcePath: asset.source,
          sourceYear: asset.year,
          sortOrder: -20 + sortIndex,
          isPublic: true,
          privacyApprovedAt,
        }];
      });
      if (missingAssets.length) await tx.mediaAsset.createMany({ data: missingAssets });

      const medical = master.categories[0];
      await tx.initiative.updateMany({
        where: { slug: 'medical-financial-assistance' },
        data: {
          title: medical.title,
          summary: medical.summary,
          story: medical.description,
          primaryMetric: null,
          primaryMetricLabel: null,
        },
      });

      await applyCanonicalFactualLocks(tx, factualLocks);
      return master.initiatives.length;
    },
    { timeout: 180000, maxWait: 10000 },
  );
}
