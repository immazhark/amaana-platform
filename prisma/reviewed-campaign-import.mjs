export async function importReviewedCampaigns(prisma, campaigns) {
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091301)`;
    const cause = await tx.cause.findFirst({ where: { slug: "seasonal-food-support", status: "PUBLISHED" } });
    if (!cause) throw new Error("Published seasonal-food-support cause required before campaign import.");
    let created = 0;
    for (const { media, ...campaign } of campaigns) {
      if (await tx.initiative.findUnique({ where: { slug: campaign.slug }, select: { id: true } })) continue;
      await tx.initiative.create({ data: {
        ...campaign, causeId: cause.id, status: "PUBLISHED", publishedAt: new Date(), isFeatured: true,
        mediaAssets: { create: media.map((asset, sortOrder) => ({
          kind: "IMAGE", title: asset.alt, publicUrl: asset.url, altText: asset.alt, caption: asset.caption,
          sourcePath: `https://drive.google.com/file/d/${asset.id}/view`, sourceYear: 2026, sortOrder,
          isPublic: true, privacyApprovedAt: new Date("2026-09-13T00:00:00.000Z"),
        })) },
      } });
      created++;
    }
    return created;
  });
}
