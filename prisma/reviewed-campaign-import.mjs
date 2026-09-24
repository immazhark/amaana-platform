export async function importReviewedCampaigns(prisma, campaigns) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091301)`;
    let cause = await tx.cause.findUnique({ where: { slug: "ramadan-eid" } });
    if (cause && cause.status !== "PUBLISHED") return 0;
    if (!cause) cause = await tx.cause.create({ data: {
      slug: "ramadan-eid", title: "Ramadan & Eid Initiatives",
      summary: "Recurring programmes that turn the spirit of Ramadan, Eid and Qurbani into thoughtful support for families facing financial hardship.",
      description: "Recurring programmes that turn the spirit of Ramadan, Eid and Qurbani into thoughtful support for families facing financial hardship.",
      status: "PUBLISHED", displayOrder: 2, publishedAt: new Date(),
    } });
    let created = 0;
    for (const { media, cause: campaignCause, ...campaign } of campaigns) {
      if (await tx.initiative.findUnique({ where: { slug: campaign.slug }, select: { id: true } })) continue;
      let targetCause = cause;
      if (campaignCause) {
        targetCause = await tx.cause.findUnique({ where: { slug: campaignCause.slug } });
        if (targetCause && targetCause.status !== "PUBLISHED") continue;
        if (!targetCause) targetCause = await tx.cause.create({ data: {
          ...campaignCause, status: "PUBLISHED", displayOrder: 2, publishedAt: new Date(),
        } });
      }
      await tx.initiative.create({ data: {
        ...campaign, causeId: targetCause.id, status: "PUBLISHED", publishedAt: new Date(), isFeatured: campaign.isFeatured === true,
        mediaAssets: { create: media.map((asset, sortOrder) => {
          const hostedVideo = (asset.kind ?? "IMAGE") === "VIDEO";
          return {
            kind: asset.kind ?? "IMAGE", title: asset.alt, publicUrl: asset.url, altText: asset.alt, caption: asset.caption,
            sourcePath: asset.source ?? `https://drive.google.com/file/d/${asset.id}/view`, sourceYear: campaign.year ?? campaign.startYear, sortOrder,
            isPublic: !hostedVideo, privacyApprovedAt: hostedVideo ? null : new Date("2026-09-13T00:00:00.000Z"),
          };
        }) },
      } });
      created++;
    }
    return created;
  }, { maxWait: 10_000, timeout: 180_000 });
}
