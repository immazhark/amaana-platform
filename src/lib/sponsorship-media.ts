import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { canRenderPublicMedia } from "@/lib/public-media";

const SPONSORSHIP_MEDIA_CANDIDATE_LIMIT = 8;

/**
 * Optional documentary media for the Taleem sponsorship journey.
 *
 * The sponsorship page must remain fully usable when the database is
 * unavailable (for example in isolated browser acceptance). Media therefore
 * enhances the page only when a published Taleem image has already passed the
 * existing public/privacy gates and the same renderability checks used by
 * PublicMedia. Unusable rows and lookup failures fall back to the PageHero's
 * existing abstract treatment.
 */
export const getSponsorEducationHeroMedia = cache(async () => {
  try {
    const candidates = await prisma.mediaAsset.findMany({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        altText: { not: "" },
        initiative: {
          slug: "taleem",
          status: "PUBLISHED",
          cause: { status: "PUBLISHED" },
        },
      },
      orderBy: [{ sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
      take: SPONSORSHIP_MEDIA_CANDIDATE_LIMIT,
      select: {
        id: true,
        kind: true,
        title: true,
        publicUrl: true,
        externalUrl: true,
        altText: true,
        caption: true,
        sourceYear: true,
        placeholder: true,
      },
    });

    return candidates.find(canRenderPublicMedia) ?? null;
  } catch {
    return null;
  }
});

/** Only the link destination's publication state is needed; never read the
 * full initiative, its media, appeals, stories or religious content here. */
export const isPublishedTaleemDestination = cache(async () => {
  try {
    return Boolean(await prisma.initiative.findFirst({
      where: { slug: "taleem", status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      select: { slug: true },
    }));
  } catch {
    logServerError("sponsorship.taleem_destination_unavailable");
    return false;
  }
});
