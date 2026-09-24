export async function normalizeReviewedCampaignFeaturing(prisma, campaigns) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091402)`;
    let changed = 0;

    for (const campaign of campaigns) {
      if (campaign.isFeatured === true) continue;
      const initiative = await tx.initiative.findUnique({
        where: { slug: campaign.slug },
        select: { id: true, status: true, summary: true, isFeatured: true },
      });
      if (!initiative || initiative.status !== "PUBLISHED" || !initiative.isFeatured) continue;
      if (initiative.summary !== campaign.summary) continue;

      await tx.initiative.update({
        where: { id: initiative.id },
        data: { isFeatured: false },
      });
      changed++;
    }

    return changed;
  }, { maxWait: 10_000, timeout: 180_000 });
}
