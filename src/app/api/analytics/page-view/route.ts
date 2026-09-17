import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { prisma } from "@/lib/prisma";
import { analyticsDateForHyderabad, isTrackablePublicPath } from "@/lib/public-analytics";
import { enforceAnalyticsRateLimit, isSameOrigin } from "@/lib/request-security";

const schema = z.object({ path: z.string().max(200).refine(isTrackablePublicPath) });
const noStore = { "Cache-Control": "no-store" };
const MAX_ANALYTICS_JSON_BYTES = 1024;

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return new NextResponse(null, { status: 204, headers: noStore });

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_ANALYTICS_JSON_BYTES));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return new NextResponse(null, { status: 204, headers: noStore });
      }
      return new NextResponse(null, { status: 204, headers: noStore });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) return new NextResponse(null, { status: 204, headers: noStore });
    if (!(await enforceAnalyticsRateLimit(request))) return new NextResponse(null, { status: 204, headers: noStore });

    const date = analyticsDateForHyderabad(new Date());
    await prisma.dailyPageView.upsert({
      where: { path_date: { path: parsed.data.path, date } },
      update: { views: { increment: 1 } },
      create: { path: parsed.data.path, date, views: 1 },
    });
    return new NextResponse(null, { status: 204, headers: noStore });
  } catch {
    return new NextResponse(null, { status: 204, headers: noStore });
  }
}
