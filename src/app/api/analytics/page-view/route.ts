import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { analyticsDateForHyderabad, isTrackablePublicPath } from "@/lib/public-analytics";
import { isSameOrigin } from "@/lib/request-security";

const schema = z.object({ path: z.string().max(200).refine(isTrackablePublicPath) });
const noStore = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return new NextResponse(null, { status: 204, headers: noStore });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return new NextResponse(null, { status: 204, headers: noStore });

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
