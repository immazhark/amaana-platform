export async function applyReviewedCampaignRevisions(prisma, revisions) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091401)`;
    let changed = 0;
    for (const revision of revisions) {
      const initiative = await tx.initiative.findUnique({ where: { slug: revision.slug }, select: { id: true, status: true, summary: true } });
      if (!initiative || initiative.status !== "PUBLISHED" || initiative.summary !== revision.expectedSummary) continue;
      await tx.initiative.update({ where: { id: initiative.id }, data: { summary: revision.summary, story: revision.story } });
      for (const [index, asset] of revision.media.entries()) {
        if (await tx.mediaAsset.findFirst({ where: { initiativeId: initiative.id, sourcePath: asset.source }, select: { id: true } })) continue;
        await tx.mediaAsset.create({ data: {
          initiativeId: initiative.id, kind: asset.kind ?? "IMAGE", title: asset.alt, publicUrl: asset.url,
          altText: asset.alt, caption: asset.caption, sourcePath: asset.source, sourceYear: asset.sourceYear ?? 2025,
          sortOrder: -10 + index, isPublic: true, privacyApprovedAt: new Date("2026-09-14T00:00:00.000Z"),
        } });
      }
      changed++;
    }
    return changed;
  }, { maxWait: 10_000, timeout: 180_000 });
}
