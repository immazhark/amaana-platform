import { TALEEM_CATALOGUE } from "@/content/taleem-catalogue";
import { acknowledgementRecordDate } from "@/lib/acknowledgement-record-date";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { RequestBodyReadTimeoutError, RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { getDonationAcknowledgementPresentation, hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";

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

    let rawBody: string;
    try {
      rawBody = await readTextBodyWithLimit(request, MAX_ACKNOWLEDGEMENT_JSON_BYTES, { timeoutMs: 5_000 });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) {
        return NextResponse.json({ found: false }, { status: 413, headers: privateHeaders });
      }
      if (error instanceof RequestBodyReadTimeoutError) {
        return NextResponse.json({ found: false }, { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } });
      }
      // Incomplete or interrupted transport is an infrastructure failure,
      // not proof that the private receipt reference is invalid.
      return NextResponse.json({ found: false }, {
        status: 503, headers: { ...privateHeaders, "Retry-After": "60" },
      });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      // A completely read but malformed payload remains indistinguishable
      // from an invalid private acknowledgement credential.
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    // Rate-limit only structurally valid private lookups, before reading donor
    // records. A receipt view must not exhaust the separate checkout quota.
    if (!(await enforceAcknowledgementRateLimit(request))) {
      return NextResponse.json({ found: false }, { status: 429, headers: privateHeaders });
    }

    const donation = await prisma.donation.findUnique({
      where: { referenceNumber: parsed.data.reference },
      select: {
        receiptTokenHash: true,
        status: true,
        amount: true,
        refundedAmount: true,
        feeContributionAmount: true,
        receiptNumber: true,
        referenceNumber: true,
        donorName: true,
        givingIntent: true,
        capturedAt: true,
        refundedAt: true,
        createdAt: true,
        providerPaymentId: true,
        appeal: { select: { title: true, slug: true } },
        fund: { select: { name: true, slug: true } },
        units: true,
        unitPrice: true,
        campaign: { select: { title: true, unitLabel: true, unitLabelPlural: true } },
        sponsorshipProgramme: true,
        sponsorshipUnits: true,
        sponsorshipMonths: true,
        sponsorshipMonthlyRate: true,
      },
    });

    const supplied = Buffer.from(hashReceiptToken(parsed.data.token));
    const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
    if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });
    }

    const amount = donation.amount.toNumber();
    const refundedAmount = donation.refundedAmount.toNumber();
    // A refund returns any covered gateway fee first; only the excess is a refund of the donation itself.
    const feeContribution = donation.feeContributionAmount.toNumber();
    const donationRefunded = Math.max(0, Math.round((refundedAmount - feeContribution) * 100) / 100);
    const presentation = getDonationAcknowledgementPresentation(donation.status, amount, donationRefunded);
    const recordDate = acknowledgementRecordDate(donation);
    // The units and price recorded on the donation itself, never the campaign's current price, so a later price
    // change cannot rewrite what this donor bought.
    const campaign = donation.campaign && donation.units && donation.unitPrice
      ? {
        title: donation.campaign.title,
        units: donation.units,
        unitLabel: donation.units === 1 ? donation.campaign.unitLabel : donation.campaign.unitLabelPlural,
        unitPrice: donation.unitPrice.toNumber(),
      }
      : null;
    // The programme, units, months and rate recorded on the donation itself, never the live catalogue rate. Only the
    // display name comes from the catalogue; the rate version stays internal.
    const sponsorship = donation.sponsorshipProgramme && donation.sponsorshipUnits && donation.sponsorshipMonths && donation.sponsorshipMonthlyRate
      ? {
        programme: TALEEM_CATALOGUE.programmes.find(item => item.id === donation.sponsorshipProgramme)?.name ?? donation.sponsorshipProgramme,
        units: donation.sponsorshipUnits,
        months: donation.sponsorshipMonths,
        monthlyRate: donation.sponsorshipMonthlyRate.toNumber(),
      }
      : null;

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
          // The donation's own refunded share; the covered gateway fee is returned first and shown separately.
          refundedAmount: donationRefunded,
          feeContributionAmount: feeContribution,
          recordDate: recordDate.toISOString(),
          providerPaymentId: donation.providerPaymentId,
          appeal: donation.appeal,
          fund: donation.fund,
          campaign,
          sponsorship,
        },
      },
      { headers: privateHeaders },
    );
  } catch {
    // Database or rate-limit outages cannot invalidate a real receipt.
    // Preserve non-disclosure while allowing safe retry without a new payment.
    return NextResponse.json({ found: false }, {
      status: 503, headers: { ...privateHeaders, "Retry-After": "60" },
    });
  }
}
