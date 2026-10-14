import "server-only";
import { timingSafeEqual } from "node:crypto";
import { getDonationAcknowledgementPresentation, hashReceiptToken, resolveAppealDonationDesignation } from "@/lib/donations";
import { summarizeDonationRecord } from "@/lib/fund-ledger";
import { requireDonationDestination } from "@/lib/donation-destination";
import { resolveFundDonationDesignation } from "@/lib/giving-funds";
import { prisma } from "@/lib/prisma";
import type { AcknowledgementRecord } from "@/lib/private-record-response";

/** Single vetted private projection for acknowledgements and future PDF delivery.
 * A caller must enforce origin, request bounds and receipt-specific abuse limits.
 * No raw database row or receipt hash is ever returned to the client.
 */
export async function readVerifiedDonationAcknowledgement(input: {
  reference: string;
  token: string;
}): Promise<AcknowledgementRecord | null> {
    const donation = await prisma.donation.findUnique({
      where: { referenceNumber: input.reference },
      select: {
        receiptTokenHash: true,
        appealId: true,
        fundId: true,
        designationSnapshot: true,
        status: true,
        currency: true,
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

    const supplied = Buffer.from(hashReceiptToken(input.token));
    const expected = Buffer.from(donation?.receiptTokenHash ?? "0".repeat(64));
    if (!donation || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
      return null;
    }

    const accounting = summarizeDonationRecord(donation);
    const amount = accounting.amountPaise / 100;
    const refundedAmount = accounting.refundedPaise / 100;
    const recordDate = donation.refundedAt ?? donation.capturedAt ?? donation.createdAt;
    const destination = requireDonationDestination(donation);
    const presentation = getDonationAcknowledgementPresentation(donation.status, amount, refundedAmount, destination.kind);
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

    return {
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
    };
}
