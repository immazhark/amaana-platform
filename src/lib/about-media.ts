import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * The About hero should reflect Amaana's documented 2020 origin story rather
 * than choosing an arbitrary recent campaign image. Publication remains
 * fail-closed: only an approved public image attached to the published 2020
 * Eid Gift Kits record can be returned. Because this image is a non-essential
 * enhancement, database/media lookup failures degrade to the existing abstract
 * hero instead of making the About page unavailable.
 */
export const getAboutOriginMedia = cache(async () => {
  try {
    return await prisma.mediaAsset.findFirst({
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
