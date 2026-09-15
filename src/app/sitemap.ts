import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { PUBLIC_STATIC_ROUTES } from "@/lib/public-routing";
import { shouldAllowIndexing } from "@/lib/site-indexing";

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
      select: { slug: true, updatedAt: true },
    }),
    prisma.initiative.findMany({
      where: {
        status: "PUBLISHED",
        slug: { notIn: redirectedLegacyInitiativeSlugs },
      },
      select: { slug: true, updatedAt: true },
    }),
    prisma.story.findMany({
      where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.faithContent.findMany({
      where: { status: "PUBLISHED", religiousReviewStatus: "VERIFIED" },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  const staticPages: MetadataRoute.Sitemap = PUBLIC_STATIC_ROUTES.map(route => ({
    url: `${base}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  return [
    ...staticPages,
    ...initiatives.map(item => ({ url: `${base}/our-work/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...stories.map(item => ({ url: `${base}/stories/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...faithContent.map(item => ({ url: `${base}/faith-and-reflections/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...appeals.map(item => ({ url: `${base}/appeals/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];
}
