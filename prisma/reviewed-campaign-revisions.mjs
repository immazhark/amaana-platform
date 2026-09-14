export async function applyReviewedCampaignRevisions(prisma, revisions, campaigns = []) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091401)`;
    let changed = 0;
    for (const revision of revisions) {
      const source = revision.syncFromCampaign
        ? campaigns.find(campaign => campaign.slug === revision.slug)
        : revision;
      if (!source) continue;
      const initiative = await tx.initiative.findUnique({ where: { slug: revision.slug }, select: { id: true, status: true, summary: true } });
      if (!initiative || initiative.status !== "PUBLISHED" || initiative.summary !== revision.expectedSummary) continue;
      await tx.initiative.update({ where: { id: initiative.id }, data: {
        summary: source.summary,
        story: source.story,
        ...(Object.hasOwn(source, "primaryMetric") ? { primaryMetric: source.primaryMetric } : {}),
        ...(Object.hasOwn(source, "primaryMetricLabel") ? { primaryMetricLabel: source.primaryMetricLabel } : {}),
      } });
      if (revision.replaceMedia) await tx.mediaAsset.deleteMany({ where: { initiativeId: initiative.id } });
      for (const [index, asset] of source.media.entries()) {
        if (await tx.mediaAsset.findFirst({ where: { initiativeId: initiative.id, sourcePath: asset.source }, select: { id: true } })) continue;
        await tx.mediaAsset.create({ data: {
          initiativeId: initiative.id, kind: asset.kind ?? "IMAGE", title: asset.alt, publicUrl: asset.url,
          altText: asset.alt, caption: asset.caption, sourcePath: asset.source, sourceYear: asset.sourceYear ?? 2025,
          sortOrder: revision.replaceMedia ? index : -10 + index, isPublic: true, privacyApprovedAt: new Date("2026-09-14T00:00:00.000Z"),
        } });
      }
      changed++;
    }
    return changed;
  }, { maxWait: 10_000, timeout: 180_000 });
}

