import { NextResponse } from "next/server";
import { getHomepageAppeals } from "@/lib/public-content";

export const dynamic = "force-dynamic";

// Eligibility changes with the clock. Keep all response paths out of browser/CDN caches.
const liveHeaders = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const appeals = await getHomepageAppeals();
    const items = appeals.slice(0, 4).map(appeal => ({
      id: `appeal-${appeal.slug}`,
      kind: "appeal" as const,
      eyebrow: "Live appeal",
      title: appeal.title,
      subtitle: appeal.summary,
      detailsHref: `/appeals/${appeal.slug}`,
      supportHref: `/donate/${appeal.slug}`,
      detailsCta: "View",
      supportCta: "Donate",
    }));

    return NextResponse.json(
      { items },
      { headers: { "Cache-Control": liveHeaders["Cache-Control"] } },
    );
  } catch {
    return NextResponse.json({ items: [] }, { status: 200, headers: liveHeaders });
  }
}
