import type { MetadataRoute } from "next";
import { canExposeAppealArchive } from "@/lib/appeal-update-publication";
import { publicFaithWhere } from "@/lib/faith-publication";
import { prisma } from "@/lib/prisma";
import { canExposePublicAppeal } from "@/lib/public-environment";
import { PUBLIC_STATIC_ROUTES } from "@/lib/public-routing";
import { programmeCategories, programmes } from "@/lib/master-copy";
import { programmeCategoryPath } from "@/lib/programme-category-routing";
import { shouldAllowIndexing } from "@/lib/site-indexing";
import { canListAppealInSitemap } from "@/lib/sitemap-privacy";

const configuredBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
const base = configuredBase.replace(/\/$/, "");

const redirectedLegacyInitiativeSlugs = [
  "medical-financial-assistance",
  "winter-drive-2025-26",
  "winter-relief-2025-26",
];

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!shouldAllowIndexing(configuredBase, process.env.NEXT_PUBLIC_ALLOW_INDEXING)) return [];

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
        slug: { notIn: redirectedLegacyInitiativeSlugs },
      },
      select: { slug: true, updatedAt: true },
    }),
    prisma.story.findMany({
      where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.faithContent.findMany({
      where: publicFaithWhere,
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const publishedInitiativeSlugs = new Set(initiatives.map(item => item.slug));
  const publishedProgrammeCategoryPaths = new Set<string>(
    programmeCategories
      .filter(category =>
        programmes.some(programme =>
          programme.causeSlug === category.slug
          && !("parentSlug" in programme)
          && publishedInitiativeSlugs.has(programme.slug),
        ),
      )
      .map(category => programmeCategoryPath(category.slug))
      .filter(path => path.startsWith("/programmes/")),
  );

  const staticPages: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES
    .filter(route => !route.path.startsWith("/programmes/") || publishedProgrammeCategoryPaths.has(route.path))
    .map(route => ({
      url: `${base}${route.path}`,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  const searchableAppeals = appeals.filter(item =>
    canExposePublicAppeal(item)
    && canExposeAppealArchive({
      appealStatus: item.status,
      hasAssistanceRequest: Boolean(item.assistanceRequest),
      archiveConsent: item.assistanceRequest?.verification?.archiveConsent,
    })
    && canListAppealInSitemap(item.assistanceRequest?.verification?.confidentialityLevel),
  );

  return [
    ...staticPages,
    ...initiatives.map(item => ({ url: `${base}/our-work/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...stories.map(item => ({ url: `${base}/stories/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...faithContent.map(item => ({ url: `${base}/faith-and-reflections/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...searchableAppeals.map(item => ({ url: `${base}/appeals/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];
}
