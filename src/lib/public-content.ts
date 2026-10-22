import type { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { publicFaithWhere } from "@/lib/faith-publication";
import { canExposePublicAppeal, isSyntheticStagingAppeal } from "@/lib/public-environment";

const publishedWhere = {
  status: "PUBLISHED" as const,
};

/** Bounded, publication-approved media only. Archives page the same projection. */
export const PUBLIC_DETAIL_MEDIA_LIMIT = 48;
export const PUBLIC_DETAIL_MEDIA_PROJECTION = {
  where: {
    isPublic: true,
    privacyApprovedAt: { not: null },
    OR: [
      { kind: "IMAGE" as const, publicUrl: { not: null }, altText: { not: "" } },
      { kind: "DOCUMENT" as const, publicUrl: { not: null } },
      { kind: "EXTERNAL_VIDEO" as const, externalUrl: { not: null } },
    ],
  },
  orderBy: [
    { sortOrder: "asc" as const },
    { sourceYear: "desc" as const },
    { createdAt: "desc" as const },
    { id: "asc" as const },
  ],
  take: PUBLIC_DETAIL_MEDIA_LIMIT,
  select: {
    id: true,
    kind: true,
    title: true,
    publicUrl: true,
    externalUrl: true,
    altText: true,
    caption: true,
    sourceYear: true,
    sortOrder: true,
    width: true,
    height: true,
  },
} satisfies Prisma.MediaAssetFindManyArgs;

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

export const getPublishedInitiativeBySlug = cache(async (slug: string) => {
  return prisma.initiative.findFirst({
    where: { slug, status: "PUBLISHED", cause: { status: "PUBLISHED" } },
    include: {
      cause: { select: { title: true } },
      mediaAssets: PUBLIC_DETAIL_MEDIA_PROJECTION,
      stories: {
        where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, title: true, summary: true },
      },
      appeals: {
        where: { status: { in: ["PUBLISHED", "FUNDED"] } },
        orderBy: { publishedAt: "desc" },
        // Only the donation-eligibility guard and linked-appeal label use
        // these fields. Never fetch internal notes or beneficiary details.
        select: {
          id: true, slug: true, title: true, status: true,
          goalAmount: true, amountRaised: true, closesAt: true,
        },
      },
      faithContent: {
        where: publicFaithWhere,
        orderBy: { publishedAt: "desc" },
        select: { id: true, slug: true, title: true, excerpt: true },
      },
    },
  });
});

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
      mediaAssets: PUBLIC_DETAIL_MEDIA_PROJECTION,
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
      mediaAssets: PUBLIC_DETAIL_MEDIA_PROJECTION,
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
    // Exclude permanently ineligible and synthetic records at retrieval.
    // The request-time check below still rejects an appeal that expires while
    // this 300-second record projection remains cached.
    where: {
      status: "PUBLISHED",
      amountRaised: { lt: prisma.appeal.fields.goalAmount },
      OR: [{ closesAt: null }, { closesAt: { gt: new Date() } }],
      NOT: [
        { slug: { startsWith: "staging-" } },
        { title: { startsWith: "STAGING TEST" } },
      ],
    },
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
    },
  });

  return appeals.filter(appeal => canExposePublicAppeal(appeal) && !isSyntheticStagingAppeal(appeal));
}, ["homepage-appeals"], { revalidate: 300, tags: ["appeals"] });

export async function getHomepageAppeals(limit = 3) {
  // Keep clock-sensitive eligibility outside the bounded DB result cache.
  // Recheck on each render even when an earlier cached query included a now-expired appeal.
  const publicAppeals = await getHomepageAppealsCached();
  return publicAppeals
    .filter(appeal => isAppealOpenForDonations(appeal))
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
