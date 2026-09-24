import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { canRenderPublicMedia } from "@/lib/public-media";

const PREFERRED_MEDIA_CANDIDATE_LIMIT = 6;
const FALLBACK_MEDIA_CANDIDATE_LIMIT = 12;

/**
 * Optional documentary media for the Get Involved landing page.
 *
 * Participation routes should remain usable even when the database is
 * unavailable. The image is therefore an enhancement only: it must belong to
 * a published initiative, be public, have explicit privacy approval and pass
 * the same renderability checks as PublicMedia. Any lookup failure or unusable
 * media record falls back to the existing abstract hero.
 */
export const getGetInvolvedHeroMedia = cache(async () => {
  try {
    const select = {
      id: true,
      kind: true,
      title: true,
      publicUrl: true,
      externalUrl: true,
      altText: true,
      caption: true,
      sourceYear: true,
    } as const;

    const preferredCandidates = await prisma.mediaAsset.findMany({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        initiative: { slug: "taleem-initiative-2025", status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: PREFERRED_MEDIA_CANDIDATE_LIMIT,
      select,
    });

    const preferredMedia = preferredCandidates.find(canRenderPublicMedia);
    if (preferredMedia) return preferredMedia;

    const fallbackCandidates = await prisma.mediaAsset.findMany({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        initiative: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      },
      orderBy: [{ sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: FALLBACK_MEDIA_CANDIDATE_LIMIT,
      select,
    });

    return fallbackCandidates.find(canRenderPublicMedia) ?? null;
  } catch {
    return null;
  }
});
