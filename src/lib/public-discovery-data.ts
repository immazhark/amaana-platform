import { publicFaithWhere } from "@/lib/faith-publication";
import { prisma } from "@/lib/prisma";

const DISCOVERY_MEDIA_CANDIDATE_LIMIT = 3;

const publicMediaSelect = {
  id: true,
  kind: true,
  title: true,
  publicUrl: true,
  externalUrl: true,
  altText: true,
  caption: true,
  sourceYear: true,
  sortOrder: true,
} as const;

export async function getStoriesDiscoveryData() {
  return prisma.story.findMany({
    where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      publishedAt: true,
      cause: { select: { title: true, status: true } },
      initiative: { select: { title: true, status: true, cause: { select: { status: true } } } },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: DISCOVERY_MEDIA_CANDIDATE_LIMIT,
        select: publicMediaSelect,
      },
    },
  });
}

export async function getFaithDiscoveryData() {
  return prisma.faithContent.findMany({
    where: publicFaithWhere,
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      excerpt: true,
      sourceCitation: true,
      verifiedAt: true,
      topics: {
        select: {
          topic: { select: { slug: true, name: true } },
        },
      },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: DISCOVERY_MEDIA_CANDIDATE_LIMIT,
        select: publicMediaSelect,
      },
    },
  });
}
