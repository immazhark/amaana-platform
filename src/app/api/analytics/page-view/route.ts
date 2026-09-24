import { NextResponse } from "next/server";
import { RequestBodyTooLargeError } from "@/lib/bounded-request-body";
import { parseAnalyticsPayload } from "@/lib/analytics-ingestion";
import { prisma } from "@/lib/prisma";
import { analyticsDateForHyderabad } from "@/lib/public-analytics";
import { enforceAnalyticsRateLimit, isSameOrigin } from "@/lib/request-security";

const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return new NextResponse(null, { status: 204, headers: noStore });

    let parsed;
    try {
      parsed = await parseAnalyticsPayload(request);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError || error instanceof SyntaxError) {
        return new NextResponse(null, { status: 204, headers: noStore });
      }
      throw error;
    }

    if (!parsed) return new NextResponse(null, { status: 204, headers: noStore });
    if (!(await enforceAnalyticsRateLimit(request))) return new NextResponse(null, { status: 204, headers: noStore });

    const date = analyticsDateForHyderabad(new Date());
    await prisma.dailyPageView.upsert({
      where: { path_date: { path: parsed.path, date } },
      update: { views: { increment: 1 } },
      create: { path: parsed.path, date, views: 1 },
    });
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 204, headers: noStore });
  }
}
