/** Internal allocation approval ≠ transfer, purchase, disbursement or aid.
 * Only recorded, net-retained, originally designated domestic fund donations
 * can be proposed. Legacy/mismatched purposes require reconciliation first. */
import { summarizeDonationRecord } from "@/lib/fund-ledger";
import { requireDonationFinancialDestination } from "@/lib/donation-destination";
import { FUND_INTENTS } from "@/lib/giving-funds";

export const ALLOCATION_MAX_PAISE = 200_000_000;
export class AllocationError extends Error {}

export function parseAllocationPaise(value: unknown): number {
  if (typeof value !== "string" || !/^(0|[1-9]\d{0,6})(?:\.\d{1,2})?$/.test(value)) {
    throw new AllocationError("Enter an INR amount with at most two decimals.");
  }
  const [rupees, fraction = ""] = value.split(".");
  const paise = Number(rupees) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(paise) || paise <= 0 || paise > ALLOCATION_MAX_PAISE) {
    throw new AllocationError("Allocation is outside permitted INR limits.");
  }
  return paise;
}

export function parseAllocationNote(input: unknown): string {
  if (typeof input !== "string") throw new AllocationError("Describe the intended use.");
  const note = input.trim().replace(/\s+/gu, " ");
  // Programme-purpose notes must not become a second shadow database for
  // beneficiary identities, payment references or personal contact details.
  const containsContactDetails =
    /(?:https?:\/\/|www\.|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}|\b(?:\+?91[-\s]?)?[6-9]\d{9}\b)/iu.test(note);
  if (note.length < 15 || note.length > 240 || containsContactDetails ||
      /[\u0000-\u001f\u007f<>]/u.test(note)) {
    throw new AllocationError("Enter 15–240 characters describing the approved fund use, without private beneficiary details.");
  }
  return note;
}

type Decimal = { mul(n: number): { toNumber(): number } };
export type AllocationSource = {
  appealId: string | null; fundId: string | null; currency: string;
  status: string; amount: Decimal; refundedAmount: Decimal;
  givingIntent: string; designationSnapshot: unknown;
  fundDisclosureConfirmedAt: Date | null;
  domesticConfirmedAt: Date;
};
export function allocationAvailablePaise(donation: AllocationSource, approvedAmounts: readonly number[]) {
  const destination = requireDonationFinancialDestination(donation);
  if (destination.kind !== "FUND" || donation.status !== "CAPTURED" ||
      !FUND_INTENTS.some(intent => intent === donation.givingIntent) ||
      !(donation.domesticConfirmedAt instanceof Date) ||
      !Number.isFinite(donation.domesticConfirmedAt.getTime()) ||
      !(donation.fundDisclosureConfirmedAt instanceof Date) ||
      !Number.isFinite(donation.fundDisclosureConfirmedAt.getTime())) {
    throw new AllocationError("Only captured eligible giving-fund donations can be allocated.");
  }
  const totals = summarizeDonationRecord(donation);
  if (totals.refundedPaise !== 0) {
    throw new AllocationError("A refunded donation requires finance review before any allocation.");
  }
  let assigned = 0;
  for (const amount of approvedAmounts) {
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > ALLOCATION_MAX_PAISE) {
      throw new AllocationError("Invalid existing approved allocation.");
    }
    assigned += amount;
    if (!Number.isSafeInteger(assigned)) throw new AllocationError("Allocation ledger exceeds safe integer precision.");
  }
  if (assigned > totals.netRetainedPaise) throw new AllocationError("Previously approved allocation exceeds retained donation funds.");
  return totals.netRetainedPaise - assigned;
}
export function assertAllocationReview(actorId: string, makerId: string, status: string) {
  if (!actorId || !makerId || actorId === makerId || status !== "PENDING") {
    throw new AllocationError("An independent authorized reviewer is required for each pending proposal.");
  }
}
