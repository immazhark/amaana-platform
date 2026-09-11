import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { shouldAllowIndexing } from "@/lib/site-indexing";

const configuredBase = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
const base = configuredBase.replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!shouldAllowIndexing(configuredBase, process.env.NEXT_PUBLIC_ALLOW_INDEXING)) return [];

  const [appeals, initiatives, stories, faithContent] = await Promise.all([
    prisma.appeal.findMany({
      where: { status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.initiative.findMany({
      where: { status: "PUBLISHED" },
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

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/our-work`, changeFrequency: "weekly", priority: 0.95 },
    { url: `${base}/impact`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/stories`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${base}/faith-and-reflections`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/appeals`, changeFrequency: "daily", priority: 0.95 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/get-involved`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/request-assistance`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/how-we-verify`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/transparency`, changeFrequency: "monthly", priority: 0.75 },
    { url: `${base}/governance`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/compliance`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/donation-policy`, changeFrequency: "yearly", priority: 0.35 },
    { url: `${base}/refund-policy`, changeFrequency: "yearly", priority: 0.35 },
  ];

  return [
    ...staticPages,
    ...initiatives.map(item => ({ url: `${base}/our-work/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...stories.map(item => ({ url: `${base}/stories/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.75 })),
    ...faithContent.map(item => ({ url: `${base}/faith-and-reflections/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...appeals.map(item => ({ url: `${base}/appeals/${item.slug}`, lastModified: item.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];
}
