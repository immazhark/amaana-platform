import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { getDonationAcknowledgementPresentation, hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/request-security";

const schema = z.object({
  reference: z.string().trim().min(8).max(80),
  token: z.string().min(20).max(300),
});

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
};
const MAX_ACKNOWLEDGEMENT_JSON_BYTES = 8 * 1024;

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ found: false }, { status: 403, headers: privateHeaders });
    }

    let body: unknown;
    try {
      body = JSON.parse(await readTextBodyWithLimit(request, MAX_ACKNOWLEDGEMENT_JSON_BYTES));
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ found: false }, { status: 413, headers: privateHeaders });
      }
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const donation = await prisma.donation.findUnique({
      where: { referenceNumber: parsed.data.reference },
      select: {
        receiptTokenHash: true,
        status: true,
        amount: true,
        refundedAmount: true,
        receiptNumber: true,
        referenceNumber: true,
        donorName: true,
        givingIntent: true,
        capturedAt: true,
        refundedAt: true,
        createdAt: true,
        providerPaymentId: true,
        appeal: { select: { title: true, slug: true } },
      },
    });

    const supplied = Buffer.from(hashReceiptToken(parsed.data.token));
    const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
    if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const amount = donation.amount.toNumber();
    const refundedAmount = donation.refundedAmount.toNumber();
    const presentation = getDonationAcknowledgementPresentation(donation.status, amount, refundedAmount);
    const recordDate = donation.refundedAt ?? donation.capturedAt ?? donation.createdAt;

    return NextResponse.json(
      {
        found: true,
        presentation,
        donation: {
          referenceNumber: donation.referenceNumber,
          receiptNumber: donation.receiptNumber,
          donorName: donation.donorName,
          givingIntent: donation.givingIntent,
          amount,
          refundedAmount,
          recordDate: recordDate.toISOString(),
          providerPaymentId: donation.providerPaymentId,
          appeal: donation.appeal,
        },
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
  }
}
