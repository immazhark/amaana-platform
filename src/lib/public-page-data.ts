import { cache } from "react";
import { canExposeAppealArchive } from "@/lib/appeal-publication";
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

export const getPublicAppeal = cache(async (slug: string) => {
  const appeal = await prisma.appeal.findFirst({
    where: { slug, status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      story: true,
      category: true,
      status: true,
      beneficiaryDisplayName: true,
      beneficiaryLocation: true,
      coverImageUrl: true,
      goalAmount: true,
      amountRaised: true,
      publishedAt: true,
      closesAt: true,
      cause: { select: { slug: true, title: true } },
      initiative: { select: { slug: true, title: true } },
      assistanceRequest: {
        select: {
          verification: {
            select: {
              archiveConsent: true,
            },
          },
        },
      },
      updates: {
        where: { isPublic: true, publishedAt: { not: null } },
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

  if (!appeal) return null;
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
    select: publicMediaSelect,
  });
});

export const getPublishedAppeals = cache(async () => {
  return prisma.appeal.findMany({
    where: { status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
    orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      category: true,
      status: true,
      goalAmount: true,
      amountRaised: true,
      closesAt: true,
      beneficiaryLocation: true,
      initiative: { select: { slug: true, title: true } },
      cause: { select: { slug: true, title: true } },
    },
  });
});

export const getImpactPageData = cache(async () => {
  return prisma.initiative.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ isFeatured: "desc" }, { displayOrder: "asc" }, { publishedAt: "desc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      story: true,
      year: true,
      startYear: true,
      endYear: true,
      primaryMetric: true,
      primaryMetricLabel: true,
      financialSummary: true,
      cause: { select: { slug: true, title: true } },
      mediaAssets: {
        where: { isPublic: true, privacyApprovedAt: { not: null } },
        orderBy: [{ sortOrder: "asc" }, { sourceYear: "desc" }],
        take: 4,
        select: publicMediaSelect,
      },
    },
  });
});
