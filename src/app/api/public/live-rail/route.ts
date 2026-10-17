import { NextResponse } from "next/server";
import { getHomepageAppeals } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const appeals = await getHomepageAppeals(4);
    const items = appeals.slice(0, 4).map(appeal => ({
      id: `appeal-${appeal.slug}`,
      kind: "appeal" as const,
      eyebrow: "Live appeal",
      title: appeal.title,
      detailsHref: `/appeals/${appeal.slug}`,
      supportHref: `/donate/${appeal.slug}`,
      detailsCta: "View",
      supportCta: "Donate",
    }));

    // Keep the shared server projection cached, but do not let downstream
    // caches outlive an administrator's appeal withdrawal.
    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
