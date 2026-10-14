import "server-only";
import { readVerifiedDonationAcknowledgement } from "@/lib/private-donation-receipt";
import { createReceiptDownloadGrant, openReceiptDownloadGrant } from "@/lib/receipt-download-grant";

/**
 * The only intended issuance/redeem entrypoint. A verified, completed financial
 * acknowledgement must exist before a download token can be minted. A grant
 * is NOT proof of payment on its own and redemption must recheck the ledger.
 */
export async function issueVerifiedReceiptDownloadGrant(input: {
  reference: string;
  token: string;
}) {
  const record = await readVerifiedDonationAcknowledgement(input);
  if (!record || !record.donation.receiptNumber ||
      !["captured", "refunded"].includes(record.presentation.tone)) return null;
  return createReceiptDownloadGrant(input);
}

/**
 * Recheck current donation state, original purpose, refund totals and late
 * beneficiary-confidentiality changes. Do not cache this private projection.
 * The ultimate response should additionally enforce same-origin, rate limits,
 * Content-Disposition: attachment and anti-indexing/no-store headers.
 */
export async function redeemVerifiedReceiptDownloadGrant(grant: unknown) {
  const opened = openReceiptDownloadGrant(grant);
  if (!opened) return null;
  const record = await readVerifiedDonationAcknowledgement(opened);
  if (!record || !record.donation.receiptNumber ||
      !["captured", "refunded"].includes(record.presentation.tone)) return null;
  return record;
}
