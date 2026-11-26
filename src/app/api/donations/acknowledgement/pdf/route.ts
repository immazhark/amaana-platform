import { TALEEM_CATALOGUE } from "@/content/taleem-catalogue";
import { acknowledgementRecordDate } from "@/lib/acknowledgement-record-date";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { acknowledgementPurposeLines, buildAcknowledgementPdf } from "@/lib/acknowledgement-pdf";
import { RequestBodyTooLargeError, readTextBodyWithLimit } from "@/lib/bounded-request-body";
import { donationIntentLabel } from "@/lib/donation-intent";
import { hashReceiptToken } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { enforceAcknowledgementRateLimit, isSameOrigin } from "@/lib/request-security";

// A downloadable copy of the ordinary donation acknowledgement. It is reached by a form POST so the private credential
// travels in the body, never in a URL, a log or a Referer. The credential handling matches the on-screen acknowledgement
// route exactly: same-origin only, a bounded body, a rate limit before any donor record is read, a constant-time
// comparison, and one indistinguishable answer for every failure.
const schema = z.object({
  reference: z.string().trim().regex(/^[A-Za-z0-9-]{8,80}$/),
  token: z.string().min(20).max(300),
});

const privateHeaders = {
  "Cache-Control": "no-store, private",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "X-Content-Type-Options": "nosniff",
};
const MAX_BODY_BYTES = 8 * 1024;
const notFound = () => NextResponse.json({ found: false }, { status: 404, headers: privateHeaders });

/** One value per field; anything repeated or missing is treated like any other invalid credential. */
function singleFields(body: string): Record<string, string> | null {
  const params = new URLSearchParams(body);
  const out: Record<string, string> = {};
  for (const name of ["reference", "token"]) {
    const values = params.getAll(name);
    if (values.length !== 1) return null;
    out[name] = values[0]!;
  }
  return out;
}

export async function POST(request: Request) {
  try {
    if (!isSameOrigin(request)) return NextResponse.json({ found: false }, { status: 403, headers: privateHeaders });

    let raw: string;
    try {
      raw = await readTextBodyWithLimit(request, MAX_BODY_BYTES, { timeoutMs: 5_000 });
    } catch (error) {
      if (error instanceof RequestBodyTooLargeError) return NextResponse.json({ found: false }, { status: 413, headers: privateHeaders });
      // A timeout or an interrupted transport is an outage, not proof the credential is wrong.
      return NextResponse.json({ found: false }, { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } });
    }

    const fields = singleFields(raw);
    const parsed = fields ? schema.safeParse(fields) : null;
    if (!parsed?.success) return notFound();

    if (!(await enforceAcknowledgementRateLimit(request))) return NextResponse.json({ found: false }, { status: 429, headers: privateHeaders });

    const donation = await prisma.donation.findUnique({
      where: { referenceNumber: parsed.data.reference },
      select: {
        receiptTokenHash: true, status: true, amount: true, refundedAmount: true, feeContributionAmount: true, receiptNumber: true,
        referenceNumber: true, donorName: true, givingIntent: true, capturedAt: true, refundedAt: true, createdAt: true,
        appeal: { select: { title: true } }, fund: { select: { name: true } },
        units: true, unitPrice: true, campaign: { select: { title: true, unitLabel: true, unitLabelPlural: true } },
        sponsorshipProgramme: true, sponsorshipUnits: true, sponsorshipMonths: true, sponsorshipMonthlyRate: true,
      },
    });

    const supplied = Buffer.from(hashReceiptToken(parsed.data.token));
    const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
    if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return notFound();

    // Only a verified payment is acknowledged. Pending, failed and fully refunded records get no document, and the answer
    // is the same one a wrong credential gets.
    const amount = donation.amount.toNumber();
    const refunded = donation.refundedAmount.toNumber();
    const feeContribution = donation.feeContributionAmount.toNumber();
    const donationRefunded = Math.max(0, Math.round((refunded - feeContribution) * 100) / 100);
    if (donation.status !== "CAPTURED" || donationRefunded >= amount) return notFound();

    const campaign = donation.campaign && donation.units && donation.unitPrice
      ? { title: donation.campaign.title, units: donation.units, unitLabel: donation.units === 1 ? donation.campaign.unitLabel : donation.campaign.unitLabelPlural, unitPrice: donation.unitPrice.toNumber() }
      : null;
    const sponsorship = donation.sponsorshipProgramme && donation.sponsorshipUnits && donation.sponsorshipMonths && donation.sponsorshipMonthlyRate
      ? {
        programme: TALEEM_CATALOGUE.programmes.find(item => item.id === donation.sponsorshipProgramme)?.name ?? donation.sponsorshipProgramme,
        units: donation.sponsorshipUnits, months: donation.sponsorshipMonths, monthlyRate: donation.sponsorshipMonthlyRate.toNumber(),
      }
      : null;

    const pdf = buildAcknowledgementPdf({
      referenceNumber: donation.referenceNumber,
      receiptNumber: donation.receiptNumber,
      donorName: donation.donorName,
      amount,
      refundedAmount: donationRefunded,
      feeContributionAmount: feeContribution,
      recordDate: acknowledgementRecordDate(donation),
      purposeLines: acknowledgementPurposeLines({
        givingIntentLabel: donationIntentLabel(donation.givingIntent),
        appeal: donation.appeal, fund: donation.fund, campaign, sponsorship,
      }),
    });

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        ...privateHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="amaana-acknowledgement-${donation.referenceNumber}.pdf"`,
        "Content-Length": String(pdf.length),
      },
    });
  } catch {
    // An outage cannot invalidate a real acknowledgement: a safe retry needs no new payment.
    return NextResponse.json({ found: false }, { status: 503, headers: { ...privateHeaders, "Retry-After": "60" } });
  }
}
