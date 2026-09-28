import { NextResponse } from "next/server";
import { getHomepageAppeals } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const appeals = await getHomepageAppeals();

    const items = appeals.slice(0, 1).map(appeal => ({
      id: `appeal-${appeal.slug}`,
      kind: "appeal" as const,
      eyebrow: "Live appeal",
      title: appeal.title,
      subtitle: appeal.summary,
      href: `/donate/${appeal.slug}`,
      cta: "Donate now",
    }));

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
