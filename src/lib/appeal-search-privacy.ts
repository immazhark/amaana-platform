import { cache } from "react";
import { prisma } from "@/lib/prisma";

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

  // An assistance-linked appeal needs its own reviewed confidentiality level.
  // Missing verification is not a public STANDARD classification.
  if (appeal?.assistanceRequest && !appeal.assistanceRequest.verification?.confidentialityLevel) {
    return "UNVERIFIED";
  }
  return appeal?.assistanceRequest?.verification?.confidentialityLevel ?? "STANDARD";
});
