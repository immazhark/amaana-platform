import { NextResponse } from "next/server";
import { getHomepageAppeals } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [appeals, initiatives] = await Promise.all([
      getHomepageAppeals(),
      prisma.initiative.findMany({
        where: { status: "PUBLISHED", isFeatured: true, cause: { status: "PUBLISHED" } },
        orderBy: [{ displayOrder: "asc" }, { publishedAt: "desc" }],
        take: 2,
        select: { slug: true, title: true, summary: true },
      }),
    ]);

    const items = [
      ...appeals.slice(0, 1).map(appeal => ({
        id: `appeal-${appeal.slug}`,
        kind: "appeal" as const,
        eyebrow: "Live appeal",
        title: appeal.title,
        subtitle: appeal.summary,
        href: `/donate/${appeal.slug}`,
        cta: "Donate now",
      })),
      ...initiatives.slice(0, appeals.length ? 1 : 2).map(initiative => ({
        id: `initiative-${initiative.slug}`,
        kind: "initiative" as const,
        eyebrow: "Live initiative",
        title: initiative.title,
        subtitle: initiative.summary,
        href: `/our-work/${initiative.slug}`,
        cta: "Explore",
      })),
    ];

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
