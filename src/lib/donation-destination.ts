import { resolveAppealDonationDesignation } from "@/lib/donations";
import { resolveFundDonationDesignation } from "@/lib/giving-funds";

/**
 * Validate the persisted money destination before any capture, reconciliation
 * or refund writes. The database also enforces this exact-one invariant.
 * Legacy records already possess an appealId and no fundId.
 */
export function requireDonationDestination(
  record: { appealId?: string | null; fundId?: string | null },
): { kind: "APPEAL"; id: string } | { kind: "FUND"; id: string } {
  const appeal = typeof record.appealId === "string" && record.appealId.length > 0;
  const fund = typeof record.fundId === "string" && record.fundId.length > 0;
  if (appeal === fund) throw new Error("Donation must have exactly one verified destination");
  return appeal ? { kind: "APPEAL", id: record.appealId! }
    : { kind: "FUND", id: record.fundId! };
}

/** Financial mutation boundary: a fund ID alone cannot establish donor intent.
 * Use its original reviewed snapshot even after that fund is paused or closed.
 */
export function requireDonationFinancialDestination(record: {
  appealId?: string | null; fundId?: string | null;
  givingIntent: string; designationSnapshot: unknown;
}) {
  const destination = requireDonationDestination(record);
  if (destination.kind === "FUND" && resolveFundDonationDesignation(record.designationSnapshot, {
    fundId: destination.id, givingIntent: record.givingIntent,
  }).provenance !== "original") {
    throw new Error("Original approved fund designation requires reconciliation");
  }
  return destination;
}

/** Private staff presentation only; never infer a donor's original purpose
 * from a currently edited GivingFund definition.
 */
export function resolvePrivateDonationPurpose(donation: {
  appealId?: string | null;
  fundId?: string | null;
  designationSnapshot: unknown;
  givingIntent: string;
  appeal?: { title: string } | null;
  fund?: { name: string } | null;
}) {
  const destination = requireDonationDestination(donation);
  if (destination.kind === "FUND") {
    if (!donation.fund) return { label: "Fund designation requires review", provenance: "review" as const };
    return resolveFundDonationDesignation(donation.designationSnapshot, {
      fundId: destination.id, givingIntent: donation.givingIntent,
    });
  }
  if (!donation.appeal) return { label: "Appeal designation requires review", provenance: "review" as const };
  return resolveAppealDonationDesignation(donation.designationSnapshot, {
    appealId: destination.id, givingIntent: donation.givingIntent,
    currentTitle: donation.appeal.title,
  });
}
