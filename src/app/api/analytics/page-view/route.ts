import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({ path: z.string().max(200).regex(/^\/(?:$|appeals(?:\/[a-z0-9-]+)?$|about$|contact$|how-we-verify$|impact$|privacy$|terms$|donation-policy$|refund-policy$|compliance$)/) });
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json()); if (!parsed.success) return new NextResponse(null, { status: 204 });
    const now = new Date(); const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    await prisma.dailyPageView.upsert({ where: { path_date: { path: parsed.data.path, date } }, update: { views: { increment: 1 } }, create: { path: parsed.data.path, date, views: 1 } });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 204 }); }
}
