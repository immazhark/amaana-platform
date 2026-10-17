import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { getAppealPublicPrivacyClass } from "@/lib/appeal-promotion";

/**
 * Search/social metadata can require a stricter privacy boundary than the
 * public accountability page itself. Highly sensitive verified cases remain
 * reachable by direct URL but are not promoted through search metadata.
 */
export const getAppealSearchPrivacy = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    select: {
      assistanceRequest: {
        select: {
          verification: { select: { confidentialityLevel: true } },
        },
      },
    },
  });

  if (!appeal) return "HIGHLY_SENSITIVE";
  return getAppealPublicPrivacyClass(appeal);
});
