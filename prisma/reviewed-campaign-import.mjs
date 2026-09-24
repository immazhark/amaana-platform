const CANONICAL_CAUSE_SLUGS = new Set([
  "medical-financial-relief",
  "emergency-humanitarian-relief",
  "ramadan-eid",
  "amaana-taleem",
  "seasonal-relief",
]);

function requireCampaignShape(campaign, index) {
  if (!campaign || typeof campaign !== "object" || Array.isArray(campaign)) {
    throw new TypeError(`Reviewed campaign at index ${index} must be an object`);
  }

  const slug = typeof campaign.slug === "string" ? campaign.slug.trim() : "";
  if (!slug) {
    throw new TypeError(`Reviewed campaign at index ${index} is missing a valid slug`);
  }

  if (!Array.isArray(campaign.media)) {
    throw new TypeError(`Reviewed campaign ${slug} must provide a media array`);
  }

  const causeSlug = typeof campaign.cause?.slug === "string"
    ? campaign.cause.slug.trim()
    : "";
  if (!causeSlug) {
    throw new TypeError(`Reviewed campaign ${slug} is missing a canonical cause slug`);
  }
  if (!CANONICAL_CAUSE_SLUGS.has(causeSlug)) {
    throw new Error(`Reviewed campaign ${slug} uses noncanonical cause ${causeSlug}`);
  }

  return { slug, causeSlug };
}

export async function importReviewedCampaigns(prisma, campaigns) {
  if (!Array.isArray(campaigns)) {
    throw new TypeError("Reviewed campaigns must be an array");
  }

  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026091301)`;

    const causeCache = new Map();
    async function getPublishedCause(slug) {
      if (causeCache.has(slug)) return causeCache.get(slug);

      const cause = await tx.cause.findUnique({
        where: { slug },
        select: { id: true, status: true },
      });
      const published = cause?.status === "PUBLISHED" ? cause : null;
      causeCache.set(slug, published);
      return published;
    }

    let created = 0;
    for (const [index, item] of campaigns.entries()) {
      const { slug, causeSlug } = requireCampaignShape(item, index);
      const { media, cause: _campaignCause, ...campaign } = item;

      if (await tx.initiative.findUnique({
        where: { slug },
        select: { id: true },
      })) {
        continue;
      }

      const targetCause = await getPublishedCause(causeSlug);
      if (!targetCause) continue;

      await tx.initiative.create({
        data: {
          ...campaign,
          causeId: targetCause.id,
          status: "PUBLISHED",
          publishedAt: new Date(),
          isFeatured: campaign.isFeatured === true,
          mediaAssets: {
            create: media.map((asset, sortOrder) => {
              const hostedVideo = (asset.kind ?? "IMAGE") === "VIDEO";
              return {
                kind: asset.kind ?? "IMAGE",
                title: asset.alt,
                publicUrl: asset.url,
                altText: asset.alt,
                caption: asset.caption,
                sourcePath: asset.source ?? `https://drive.google.com/file/d/${asset.id}/view`,
                sourceYear: campaign.year ?? campaign.startYear,
                sortOrder,
                isPublic: !hostedVideo,
                privacyApprovedAt: hostedVideo
                  ? null
                  : new Date("2026-09-13T00:00:00.000Z"),
              };
            }),
          },
        },
      });
      created++;
    }

    return created;
  }, { maxWait: 10_000, timeout: 180_000 });
}
