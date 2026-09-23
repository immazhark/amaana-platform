import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { canRenderPublicMedia } from "@/lib/public-media";

const ABOUT_MEDIA_CANDIDATE_LIMIT = 6;

/**
 * The About hero should reflect Amaana's documented 2020 origin story rather
 * than choosing an arbitrary recent campaign image. Publication remains
 * fail-closed: only an approved public image attached to the published 2020
 * Eid Gift Kits record can be returned. Because this image is a non-essential
 * enhancement, unusable media and database lookup failures degrade to the
 * existing abstract hero instead of making the About page unavailable.
 */
export const getAboutOriginMedia = cache(async () => {
  try {
    const candidates = await prisma.mediaAsset.findMany({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        initiative: {
          slug: "eid-gift-kits-2020",
          status: "PUBLISHED",
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: ABOUT_MEDIA_CANDIDATE_LIMIT,
      select: {
        id: true,
        kind: true,
        title: true,
        publicUrl: true,
        externalUrl: true,
        altText: true,
        caption: true,
        sourceYear: true,
      },
    });

    return candidates.find(canRenderPublicMedia) ?? null;
  } catch {
    return null;
  }
});
