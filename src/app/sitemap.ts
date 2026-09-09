import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const base = "https://amaanafoundation.org";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appeals = await prisma.appeal.findMany({ where: { status: { in: ["PUBLISHED", "FUNDED", "CLOSED"] } }, select: { slug: true, updatedAt: true } });
  const pages = ["", "/appeals", "/about", "/impact", "/how-we-verify", "/request-assistance", "/contact", "/compliance", "/privacy", "/terms", "/donation-policy", "/refund-policy"];
  return [...pages.map(path => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: path === "" || path === "/appeals" ? "daily" as const : "monthly" as const, priority: path === "" ? 1 : path === "/appeals" ? .9 : .6 })), ...appeals.map(appeal => ({ url: `${base}/appeals/${appeal.slug}`, lastModified: appeal.updatedAt, changeFrequency: "weekly" as const, priority: .8 }))];
}
