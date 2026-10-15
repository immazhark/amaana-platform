import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { canPromoteAppeal } from "@/lib/appeal-promotion";
import { publicFaithWhere } from "@/lib/faith-publication";
import { canExposePublicAppeal, isSyntheticStagingAppeal } from "@/lib/public-environment";

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
    where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
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
  const initiative = await prisma.initiative.findFirst({
    where: { slug, status: "PUBLISHED", cause: { status: "PUBLISHED" } },
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
        include: {
          assistanceRequest: {
            select: { verification: { select: { confidentialityLevel: true } } },
          },
        },
      },
      faithContent: {
        where: publicFaithWhere,
        orderBy: { publishedAt: "desc" },
      },
    },
  });
  if (!initiative) return null;
  return {
    ...initiative,
    appeals: initiative.appeals
      .filter(canPromoteAppeal)
      .map(({ assistanceRequest: _privateReview, ...publicAppeal }) => {
        void _privateReview;
        return publicAppeal;
      }),
  };
}

export async function getPublishedStories() {
  return prisma.story.findMany({
    where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
    include: {
      cause: true,
      initiative: { include: { cause: true } },
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
      initiative: { include: { cause: true } },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function getPublishedFaithContent() {
  return prisma.faithContent.findMany({
    where: publicFaithWhere,
    include: {
      topics: { include: { topic: true } },
      cause: true,
      initiative: { include: { cause: true } },
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
      ...publicFaithWhere,
    },
    include: {
      topics: { include: { topic: true } },
      cause: true,
      initiative: { include: { cause: true } },
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
      ...publicFaithWhere,
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
const getHomepageAppealsCached = unstable_cache(async () => {
  const appeals = await prisma.appeal.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      beneficiaryLocation: true,
      coverImageUrl: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
      assistanceRequest: {
        select: { verification: { select: { confidentialityLevel: true } } },
      },
    },
  });

  return appeals
    .filter(appeal => canExposePublicAppeal(appeal) && !isSyntheticStagingAppeal(appeal) && canPromoteAppeal(appeal) && isAppealOpenForDonations(appeal))
    .slice(0, 20)
    .map(({ assistanceRequest: _privateReview, ...publicAppeal }) => {
        void _privateReview;
        return publicAppeal;
      });
}, ["homepage-appeals"], { revalidate: 300, tags: ["appeals"] });

export async function getHomepageAppeals(limit = 3) {
  // The cached projection may outlive a campaign's exact closing minute.
  // Recheck time-sensitive donation eligibility on every render without
  // fetching the database again or exposing an already closed appeal.
  const cached = await getHomepageAppealsCached();
  // Restrict only after the fresh deadline check. A featured appeal can expire
  // during the five-minute cache lifetime; a lower-ranked eligible appeal
  // must be allowed to fill its place without another database read.
  return cached.filter(appeal => isAppealOpenForDonations(appeal))
    .slice(0, Math.min(20, Math.max(1, limit)));
}

export async function getHomepagePublicContent() {
  const [appeals, initiatives, featuredFaith, stories] = await Promise.all([
    getHomepageAppeals(),
    prisma.initiative.findMany({
      where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
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
        ...publicFaithWhere,
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

  return {
    appeals,
    initiatives,
    featuredFaith,
    stories,
  };
}
