import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { getDonationAcknowledgementPresentation, hashReceiptToken, resolveAppealDonationDesignation } from "@/lib/donations";
import { requireDonationDestination } from "@/lib/donation-destination";
import { resolveFundDonationDesignation } from "@/lib/giving-funds";
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
        appealId: true,
        fundId: true,
        designationSnapshot: true,
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
        fund: { select: { name: true } },
        appeal: {
          select: {
            title: true,
            slug: true,
            assistanceRequest: { select: { verification: { select: { confidentialityLevel: true } } } },
          },
        },
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
    const destination = requireDonationDestination(donation);
    let appeal: { title: string; slug: string | null };
    if (destination.kind === "FUND") {
      if (!donation.fund) throw new Error("Fund donation has no linked designation");
      const purpose = resolveFundDonationDesignation(donation.designationSnapshot, {
        fundId: destination.id,
        givingIntent: donation.givingIntent,
      });
      appeal = { title: purpose.label, slug: null };
    } else {
      if (!donation.appeal) throw new Error("Appeal donation has no linked designation");
      const purpose = resolveAppealDonationDesignation(donation.designationSnapshot, {
        appealId: destination.id,
        givingIntent: donation.givingIntent,
        currentTitle: donation.appeal.title,
      });
      // A confidentiality escalation must never reveal historic beneficiary
      // names or a name-bearing slug through an old donor receipt link.
      const highlySensitive = donation.appeal.assistanceRequest?.verification?.confidentialityLevel === "HIGHLY_SENSITIVE";
      appeal = highlySensitive
        ? { title: "Confidential assistance appeal", slug: null }
        : { title: purpose.label, slug: donation.appeal.slug };
    }

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
          designationKind: destination.kind,
          appeal,
        },
      },
      { headers: privateHeaders },
    );
  } catch {
    return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
  }
}
