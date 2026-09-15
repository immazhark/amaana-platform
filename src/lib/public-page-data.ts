import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { isAppealOpenForDonations } from "@/lib/appeals";
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
  return prisma.appeal.findFirst({
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
            take: 1,
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
        take: 1,
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

  if (!appeal || !isAppealOpenForDonations(appeal)) return null;
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