import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { hashTrackingToken } from "@/lib/assistance";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ reference: string }> };
const privateHeaders = { "Cache-Control": "no-store, private" };

export async function GET(request: Request, { params }: Props) {
  const { reference } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const record = await prisma.assistanceRequest.findUnique({ where: { referenceNumber: reference }, select: { trackingTokenHash: true, status: true, createdAt: true, updatedAt: true } });
  const supplied = Buffer.from(hashTrackingToken(token));
  const expected = Buffer.from(record?.trackingTokenHash ?? "0".repeat(64));
  if (!record || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return NextResponse.json({ error: "Request not found." }, { status: 404, headers: privateHeaders });
  return NextResponse.json({ referenceNumber: reference, status: record.status, submittedAt: record.createdAt, updatedAt: record.updatedAt }, { headers: privateHeaders });
}
