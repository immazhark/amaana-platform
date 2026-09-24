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

async function applyInitiativeFactualLock(tx, locksVersion, lock, slug) {
  const existing = await tx.initiative.findUnique({ where: { slug } });
  if (!existing) return;

  const data = {
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

  await tx.initiative.update({ where: { id: existing.id }, data });
}

async function applyCanonicalFactualLocks(tx, locks) {
  for (const lock of locks.initiatives) {
    await applyInitiativeFactualLock(tx, locks.version, lock, lock.slug);
    for (const legacySlug of lock.legacySlugs || []) {
      await applyInitiativeFactualLock(tx, locks.version, lock, legacySlug);
    }
  }
}

async function reconcileLegacyCategories(tx) {
  for (const [oldSlug, targetSlug] of Object.entries(LEGACY_CATEGORY_TARGETS)) {
    const [category, target] = await Promise.all([
      tx.cause.findUnique({ where: { slug: oldSlug } }),
      tx.cause.findUnique({ where: { slug: targetSlug } }),
    ]);
    if (!category || !target || category.id === target.id) continue;

    await tx.initiative.updateMany({ where: { causeId: category.id }, data: { causeId: target.id } });
    await tx.appeal.updateMany({ where: { causeId: category.id }, data: { causeId: target.id } });
    await tx.story.updateMany({ where: { causeId: category.id }, data: { causeId: target.id } });
    await tx.cause.update({ where: { id: category.id }, data: { status: 'ARCHIVED' } });
  }
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

      for (const [displayOrder, record] of master.initiatives.entries()) {
        const { causeSlug, parentSlug, programmeStatus, facts, dataCaveat, ...copy } = record;
        const existing = await tx.initiative.findUnique({ where: { slug: copy.slug } });
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

      const winter = await tx.initiative.findUnique({ where: { slug: 'winter-relief' } });
      for (const slug of ['winter-drive-2025-26', 'winter-relief-2025-26']) {
        const legacyWinter = await tx.initiative.findUnique({ where: { slug } });
        if (winter && legacyWinter) {
          await tx.mediaAsset.updateMany({
            where: { initiativeId: legacyWinter.id },
            data: { initiativeId: winter.id },
          });
        }
      }

      const assets = await readJson('./integration-media.json');
      for (const [sortIndex, asset] of assets.entries()) {
        const initiative = await tx.initiative.findUnique({ where: { slug: asset.slug } });
        if (!initiative) continue;
        if (await tx.mediaAsset.findFirst({ where: { initiativeId: initiative.id, publicUrl: asset.url } })) {
          continue;
        }
        await tx.mediaAsset.create({
          data: {
            initiativeId: initiative.id,
            kind: 'IMAGE',
            publicUrl: asset.url,
            title: asset.alt,
            altText: asset.alt,
            caption: asset.caption,
            sourcePath: asset.source,
            sourceYear: asset.year,
            sortOrder: -20 + sortIndex,
            isPublic: true,
            privacyApprovedAt: new Date(),
          },
        });
      }

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
