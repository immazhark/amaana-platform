import { cache } from "react";
import { prisma } from "@/lib/prisma";

/**
 * Optional documentary media for the Get Involved landing page.
 *
 * Participation routes should remain usable even when the database is
 * unavailable. The image is therefore an enhancement only: it must belong to
 * a published initiative, be public, have explicit privacy approval and expose
 * a public URL. Any lookup failure falls back to the existing abstract hero.
 */
export const getGetInvolvedHeroMedia = cache(async () => {
  try {
    return await prisma.mediaAsset.findFirst({
      where: {
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        initiative: { status: "PUBLISHED" },
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
