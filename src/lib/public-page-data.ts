import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { isAppealOpenForDonations } from "@/lib/appeals";
import { canExposeAppealArchive } from "@/lib/appeal-update-publication";
import { canExposePublicAppeal } from "@/lib/public-environment";
import {
  getPublishedFaithContentBySlug,
  getPublishedInitiativeBySlug,
  getPublishedStoryBySlug,
} from "@/lib/public-content";

/**
 * React request memoization for dynamic routes whose metadata and page body
 * need the same public record. This keeps metadata generation from causing a
 * second identical Prisma read during one render request while preserving the
 * existing publication/privacy gates in the underlying getters.
 */
export const getInitiativePageData = cache(getPublishedInitiativeBySlug);
export const getStoryPageData = cache(getPublishedStoryBySlug);
export const getFaithPageData = cache(getPublishedFaithContentBySlug);

export const getAppealPageData = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      beneficiaryLocation: true,
      beneficiaryDisplayName: true,
      story: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
      publishedAt: true,
      assistanceRequest: {
        select: {
          id: true,
          verification: { select: { archiveConsent: true } },
        },
      },
      updates: {
        where: { isPublic: true },
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          title: true,
          content: true,
          publishedAt: true,
        },
      },
    },
  });

  if (!appeal || !canExposePublicAppeal(appeal)) return null;
  if (!canExposeAppealArchive({
    appealStatus: appeal.status,
    hasAssistanceRequest: Boolean(appeal.assistanceRequest),
    archiveConsent: appeal.assistanceRequest?.verification?.archiveConsent,
  })) return null;

  const { assistanceRequest: privateVerificationContext, ...publicAppeal } = appeal;
  void privateVerificationContext;
  return publicAppeal;
});

export const getHomepageHeroMedia = cache(async () => {
  return prisma.mediaAsset.findFirst({
    where: {
      kind: "IMAGE",
      isPublic: true,
      privacyApprovedAt: { not: null },
      publicUrl: { not: null },
      OR: [
        { initiative: { status: "PUBLISHED" } },
        { story: { status: "PUBLISHED", privacyApprovedAt: { not: null } } },
      ],
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
      initiative: { select: { slug: true, title: true } },
      story: { select: { slug: true, title: true } },
    },
  });
});

/**
 * Lean discovery projection for the dynamic homepage.
 *
 * Home only needs featured/specified programme records and a few identity-image
 * candidates per umbrella area. This avoids serializing the full annual archive
 * on every homepage request.
 */
export const getHomepageDiscoveryData = cache(async () => {
  const fieldSlugs = ["qurbani-meat-distribution-2026", "dates-distribution-2026"];

  const [initiatives, causes] = await Promise.all([
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        OR: [{ isFeatured: true }, { slug: { in: fieldSlugs } }],
      },
      orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
      take: 7,
      select: {
        id: true,
        slug: true,
        title: true,
        summary: true,
        year: true,
        endYear: true,
        isFeatured: true,
        primaryMetric: true,
        primaryMetricLabel: true,
        cause: { select: { title: true } },
        mediaAssets: {
          where: { kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null }, publicUrl: { not: null } },
          orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }, { createdAt: "desc" }],
          take: 3,
          select: {
            id: true, kind: true, title: true, publicUrl: true, externalUrl: true,
            altText: true, caption: true, sourceYear: true, sortOrder: true,
          },
        },
      },
    }),
    prisma.cause.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
      select: {
        slug: true,
        initiatives: {
          where: { status: "PUBLISHED" },
          orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
          take: 4,
          select: {
            mediaAssets: {
              where: { kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null }, publicUrl: { not: null } },
              orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }, { createdAt: "desc" }],
              take: 3,
              select: {
                id: true, kind: true, title: true, publicUrl: true, externalUrl: true,
                altText: true, caption: true, sourceYear: true, sortOrder: true,
              },
            },
          },
        },
      },
    }),
  ]);

  return { initiatives, causes };
});

/**
 * Lean discovery projection for /our-work.
 *
 * The index only needs public cause copy, initiative summaries/metrics and one
 * approved documentary image per initiative. It deliberately avoids loading
 * stories, appeals, faith content, financial summaries and full media galleries.
 */
export const getOurWorkIndexData = cache(async () => {
  return prisma.cause.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      initiatives: {
        where: { status: "PUBLISHED" },
        orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          year: true,
          startYear: true,
          endYear: true,
          isFeatured: true,
          primaryMetric: true,
          primaryMetricLabel: true,
          mediaAssets: {
            where: {
              kind: "IMAGE",
              isPublic: true,
              privacyApprovedAt: { not: null },
              publicUrl: { not: null },
            },
            orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }],
            take: 3,
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
            },
          },
        },
      },
    },
  });
});

/**
 * Impact only needs public initiative identity, cause context, metrics and a
 * single approved witness image. Keeping this separate avoids serializing full
 * initiative stories and complete media galleries on the evidence index.
 */
export const getImpactPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      cause: { select: { title: true } },
      mediaAssets: {
        where: {
          kind: "IMAGE",
          isPublic: true,
          privacyApprovedAt: { not: null },
          publicUrl: { not: null },
        },
        orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }],
        take: 3,
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
      },
    },
  });
});

/**
 * Completed-case showcase for /appeals. Keep this intentionally narrow: only
 * published initiatives under the canonical medical/financial relief cause and
 * at most one approved public image per record are needed for the card strip.
 */
export const getCompletedAidShowcaseData = cache(async () => {
  return prisma.initiative.findMany({
    where: {
      status: "PUBLISHED",
      cause: { slug: "medical-financial-relief", status: "PUBLISHED" },
    },
    orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      slug: true,
      mediaAssets: {
        where: {
          kind: "IMAGE",
          isPublic: true,
          privacyApprovedAt: { not: null },
          publicUrl: { not: null },
        },
        orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }],
        take: 3,
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
      },
    },
  });
});

/**
 * Appeals index projection. The card grid needs only public fundraising fields;
 * it should not serialize the private-facing story, internal notes or updates.
 */
export const getAppealsIndexData = cache(async () => {
  return prisma.appeal.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      slug: true,
      title: true,
      summary: true,
      category: true,
      beneficiaryLocation: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
    },
  });
});

/**
 * Donation page projection. Checkout is available only while the appeal is
 * published, below target and inside any configured fundraising window.
 */
export const getDonationPageData = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      beneficiaryLocation: true,
      category: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
    },
  });

  if (!appeal || !canExposePublicAppeal(appeal) || !isAppealOpenForDonations(appeal)) return null;
  return appeal;
});

/**
 * Transparency needs initiative identity, cause context and published metrics,
 * but not galleries, appeals, stories or financial-summary relations.
 */
export const getTransparencyPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      cause: { select: { title: true } },
    },
  });
});


/**
 * One reviewed image per child programme, fetched in a single query.
 * Used by programme hubs so authentic media can replace generic placeholders
 * without introducing N+1 reads or bypassing publication/privacy gates.
 */
export const getProgrammeChildMedia = cache(async (slugs: string[]) => {
  if (!slugs.length) return [];
  return prisma.initiative.findMany({
    where: { slug: { in: slugs }, status: "PUBLISHED" },
    select: {
      slug: true,
      mediaAssets: {
        where: {
          kind: "IMAGE",
          isPublic: true,
          privacyApprovedAt: { not: null },
          publicUrl: { not: null },
        },
        orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }, { createdAt: "desc" }],
        take: 3,
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
      },
    },
  });
});
