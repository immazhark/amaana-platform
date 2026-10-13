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
  // The server must honor the same explicit opt-in as the client. Without
  // this guard a forged same-origin request could create database writes even
  // while the browser reporter is disabled, increasing Railway costs.
  if (process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS !== "true") {
    return new NextResponse(null, { status: 204, headers: privateHeaders });
  }

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
