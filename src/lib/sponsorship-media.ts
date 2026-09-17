import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Optional documentary media for the Taleem sponsorship journey.
 *
 * The sponsorship page must remain fully usable when the database is
 * unavailable (for example in isolated browser acceptance). Media therefore
 * enhances the page only when a published Taleem image has already passed the
 * existing public/privacy gates; otherwise the PageHero keeps its abstract
 * fallback treatment.
 */
export const getSponsorEducationHeroMedia = cache(async () => {
  try {
    return await prisma.mediaAsset.findFirst({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        initiative: {
          slug: "taleem",
          status: "PUBLISHED",
        },
      },
      orderBy: [{ sourceYear: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }],
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
  } catch {
    return null;
  }
});
