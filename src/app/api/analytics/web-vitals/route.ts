import { NextResponse } from "next/server";
import { RequestBodyTooLargeError } from "@/lib/bounded-request-body";
import { parseWebVitalPayload } from "@/lib/web-vitals-ingestion";
import { prisma } from "@/lib/prisma";
import { analyticsDateForHyderabad } from "@/lib/public-analytics";
import { enforceAnalyticsRateLimit, isSameOrigin } from "@/lib/request-security";

export const runtime = "nodejs";
const privateHeaders = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};

export async function POST(request: Request) {
  // Best-effort, low-volume analytics must never expose database state.
  try {
    if (!isSameOrigin(request)) return new NextResponse(null, { status: 204, headers: privateHeaders });
    let parsed;
    try {
      parsed = await parseWebVitalPayload(request);
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError || error instanceof SyntaxError) {
        return new NextResponse(null, { status: 204, headers: privateHeaders });
      }
      throw error;
    }
    if (!parsed) return new NextResponse(null, { status: 204, headers: privateHeaders });
    if (!(await enforceAnalyticsRateLimit(request))) {
      return new NextResponse(null, { status: 204, headers: privateHeaders });
    }

    const date = analyticsDateForHyderabad(new Date());
    const counts = {
      excellent: Number(parsed.bucket === "excellent"),
      good: Number(parsed.bucket === "good"),
      needsImprovement: Number(parsed.bucket === "needsImprovement"),
      poor: Number(parsed.bucket === "poor"),
    };
    await prisma.dailyWebVital.upsert({
      where: { path_date_metric: { path: parsed.path, date, metric: parsed.name } },
      create: { path: parsed.path, date, metric: parsed.name, ...counts },
      update: {
        excellent: { increment: counts.excellent },
        good: { increment: counts.good },
        needsImprovement: { increment: counts.needsImprovement },
        poor: { increment: counts.poor },
      },
    });
  } catch {
    // Telemetry must not interrupt rendering and must not disclose private errors.
  }
  return new NextResponse(null, { status: 204, headers: privateHeaders });
}
