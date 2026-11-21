import { createReceiptToken, hashReceiptToken } from "@/lib/donations";
import { privateDonationAcknowledgementPath } from "@/lib/private-donation-ack";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

/** A message that is safe to show to staff. Anything else that goes wrong is reported generically. */
export class ReceiptLinkError extends Error {}

export const REISSUE_REASON_MIN = 3;
export const REISSUE_REASON_MAX = 300;

/**
 * Staff reissue of a donor's private acknowledgement link (AF-RECEIPTS, stage 1 of the recovery scope).
 *
 * Replaces the stored token hash, so the old link stops working at once: that is the revocation. The new token is returned
 * to the caller exactly once and is never stored in the clear, logged, or written to the audit trail; the audit event records
 * who reissued which donation and why, nothing else. Staff must relay the link only through a channel they have verified
 * for that donor.
 */
export async function reissueReceiptLink(input: { donationId: string; actorId: string; reason: string }) {
  const reason = input.reason.trim();
  if (!input.donationId || !input.actorId) throw new ReceiptLinkError("A donation and a signed-in staff member are required.");
  if (reason.length < REISSUE_REASON_MIN || reason.length > REISSUE_REASON_MAX) {
    throw new ReceiptLinkError(`Give a reason of ${REISSUE_REASON_MIN} to ${REISSUE_REASON_MAX} characters.`);
  }
  const token = createReceiptToken();
  const receiptTokenHash = hashReceiptToken(token);

  return withSerializableTransactionRetry(async tx => {
    const donation = await tx.donation.findUnique({ where: { id: input.donationId }, select: { id: true, referenceNumber: true } });
    if (!donation) throw new ReceiptLinkError("Donation not found.");
    await tx.donation.update({ where: { id: donation.id }, data: { receiptTokenHash } });
    await tx.auditEvent.create({
      data: { actorId: input.actorId, action: "donation.receipt_link.reissue", entityType: "Donation", entityId: donation.id, metadata: { reason } },
    });
    return { referenceNumber: donation.referenceNumber, path: privateDonationAcknowledgementPath(donation.referenceNumber, token) };
  });
}
