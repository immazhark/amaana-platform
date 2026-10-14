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
