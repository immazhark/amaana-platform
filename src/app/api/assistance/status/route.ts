import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { hashTrackingToken } from "@/lib/assistance";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/request-security";

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const schema = z.object({
  reference: z.string().trim().min(1).max(64),
  token: z.string().min(20).max(256),
});

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ found: false }, { status: 403, headers: privateHeaders });
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ found: false }, { headers: privateHeaders });
    }

    const candidate = await prisma.assistanceRequest.findUnique({
      where: { referenceNumber: parsed.data.reference },
      select: {
        trackingTokenHash: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const supplied = Buffer.from(hashTrackingToken(parsed.data.token));
    const expected = Buffer.from(candidate?.trackingTokenHash ?? "0".repeat(64));
    const valid = candidate && supplied.length === expected.length && timingSafeEqual(supplied, expected);

    if (!valid || !candidate) {
      return NextResponse.json({ found: false }, { headers: privateHeaders });
    }

    return NextResponse.json(
      {
        found: true,
        status: candidate.status,
        createdAt: candidate.createdAt.toISOString(),
        updatedAt: candidate.updatedAt.toISOString(),
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ found: false }, { headers: privateHeaders });
  }
}
