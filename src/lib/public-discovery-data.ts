import { prisma } from "@/lib/prisma";

const publicMediaSelect = {
  id: true,
  kind: true,
  title: true,
  publicUrl: true,
  externalUrl: true,
  altText: true,
  caption: true,
  sourceYear: true,
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
      cause: { select: { title: true } },
      initiative: { select: { title: true } },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: publicMediaSelect,
      },
    },
  });
}

export async function getFaithDiscoveryData() {
  return prisma.faithContent.findMany({
    where: {
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      type: true,
      title: true,
      excerpt: true,
      sourceCitation: true,
      topics: {
        select: {
          topic: { select: { slug: true, name: true } },
        },
      },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
        take: 1,
        select: publicMediaSelect,
      },
    },
  });
}
