import type { MetadataRoute } from "next";
import { canExposeAppealArchive } from "@/lib/appeal-update-publication";
import { isPublicFaithReviewComplete, publicFaithWhere } from "@/lib/faith-publication";
import { prisma } from "@/lib/prisma";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { PUBLIC_STATIC_ROUTES } from "@/lib/public-routing";
import { publishedProgrammeCategoryPaths } from "@/lib/sitemap-programme-categories";
import { shouldAllowIndexing } from "@/lib/site-indexing";
import { canListAppealInSitemap, isCanonicalSitemapSlug } from "@/lib/sitemap-privacy";
import { isLegacyOurWorkSlug } from "@/lib/our-work-routing";

const configuredBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";

export const revalidate = 900;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!shouldAllowIndexing(configuredBase, process.env.NEXT_PUBLIC_ALLOW_INDEXING)) return [];
  const base = new URL(configuredBase).origin;

  const [appeals, initiatives, stories, faithContent] = await Promise.all([
    prisma.appeal.findMany({
      where: { status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
      select: {
        slug: true,
        title: true,
        status: true,
        updatedAt: true,
        assistanceRequest: {
          select: {
            verification: {
              select: {
                confidentialityLevel: true,
                archiveConsent: true,
              },
            },
          },
        },
      },
    }),
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        cause: { status: "PUBLISHED" },
      },
      select: { slug: true, updatedAt: true },
    }),
    prisma.story.findMany({
      where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.faithContent.findMany({
      where: publicFaithWhere,
      select: { slug: true, updatedAt: true, status: true, religiousReviewStatus: true, verifiedAt: true, sourceCitation: true },
    }),
  ]);

  const canonicalInitiatives = initiatives.filter(item => isCanonicalSitemapSlug(item.slug) && !isLegacyOurWorkSlug(item.slug));
  const publishedInitiativeSlugs = new Set(canonicalInitiatives.map(item => item.slug));
  const availableProgrammeCategoryPaths = publishedProgrammeCategoryPaths(publishedInitiativeSlugs);

  const staticPages: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES
    .filter(route => !route.path.startsWith("/programmes/") || availableProgrammeCategoryPaths.has(route.path))
    .map(route => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  const searchableAppeals = appeals.filter(item =>
    isCanonicalSitemapSlug(item.slug)
    && canExposePublicAppeal(item)
    && canExposeAppealArchive({
      appealStatus: item.status,
      hasAssistanceRequest: Boolean(item.assistanceRequest),
      archiveConsent: item.assistanceRequest?.verification?.archiveConsent,
    })
    // Null confidentiality is allowed for unlinked appeals only.
    // A linked assistance request requires a reviewed classification to enter search.
    && (!item.assistanceRequest || item.assistanceRequest.verification?.confidentialityLevel != null)
    && canListAppealInSitemap(item.assistanceRequest?.verification?.confidentialityLevel),
  );

  return [
    ...staticPages,
    ...canonicalInitiatives.map(item => ({ url: `${base}/our-work/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...stories.filter(item => isCanonicalSitemapSlug(item.slug)).map(item => ({ url: `${base}/stories/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...faithContent.filter(item => isCanonicalSitemapSlug(item.slug) && isPublicFaithReviewComplete(item)).map(item => ({ url: `${base}/faith-and-reflections/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...searchableAppeals.map(item => ({ url: `${base}/appeals/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];
}
