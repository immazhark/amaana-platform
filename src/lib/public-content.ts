import { prisma } from "@/lib/prisma";

const publishedWhere = {
  status: "PUBLISHED" as const,
};

export async function getPublishedCauses() {
  return prisma.cause.findMany({
    where: publishedWhere,
    include: {
      initiatives: {
        where: publishedWhere,
        orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
  });
}

export async function getPublishedInitiatives() {
  return prisma.initiative.findMany({
    where: publishedWhere,
    include: {
      cause: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
  });
}

export async function getPublishedInitiativeBySlug(slug: string) {
  return prisma.initiative.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      cause: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
      stories: {
        where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
      },
      appeals: {
        where: { status: { in: ["PUBLISHED", "FUNDED"] } },
        orderBy: { publishedAt: "desc" },
      },
      faithContent: {
        where: {
          status: "PUBLISHED",
          religiousReviewStatus: "VERIFIED",
        },
        orderBy: { publishedAt: "desc" },
      },
    },
  });
}

export async function getPublishedStories() {
  return prisma.story.findMany({
    where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
    include: {
      cause: true,
      initiative: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getPublishedStoryBySlug(slug: string) {
  return prisma.story.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      privacyApprovedAt: { not: null },
    },
    include: {
      cause: true,
      initiative: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getPublishedFaithContent() {
  return prisma.faithContent.findMany({
    where: {
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
    },
    include: {
      topics: { include: { topic: true } },
      cause: true,
      initiative: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
  });
}

export async function getPublishedFaithContentBySlug(slug: string) {
  return prisma.faithContent.findFirst({
    where: {
      slug,
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
    },
    include: {
      topics: { include: { topic: true } },
      cause: true,
      initiative: true,
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getFeaturedFaithContent() {
  return prisma.faithContent.findFirst({
    where: {
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
      isFeatured: true,
    },
    include: {
      topics: { include: { topic: true } },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { publishedAt: "desc" },
  });
}

/**
 * Homepage-only projection.
 *
 * The homepage is intentionally dynamic, but it should not pull full initiative,
 * story, faith or appeal records when only a small subset is rendered. Keeping
 * this projection narrow lowers database work, serialization and server render
 * cost while preserving the publication/privacy gates used elsewhere.
 */
export async function getHomepagePublicContent() {
  const [appeals, initiatives, featuredFaith, stories] = await Promise.all([
    prisma.appeal.findMany({
      where: { status: { in: ["PUBLISHED", "FUNDED"] } },
      orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
      take: 3,
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        beneficiaryLocation: true,
        goalAmount: true,
        amountRaised: true,
      },
    }),
    prisma.initiative.findMany({
      where: publishedWhere,
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
      take: 7,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        primaryMetric: true,
        primaryMetricLabel: true,
        cause: { select: { title: true } },
      },
    }),
    prisma.faithContent.findFirst({
      where: {
        status: "PUBLISHED",
        religiousReviewStatus: "VERIFIED",
        isFeatured: true,
      },
      orderBy: { publishedAt: "desc" },
      select: {
        type: true,
        title: true,
        excerpt: true,
      },
    }),
    prisma.story.findMany({
      where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }],
      take: 3,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        publishedAt: true,
      },
    }),
  ]);

  return { appeals, initiatives, featuredFaith, stories };
}
