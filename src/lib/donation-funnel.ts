import type { DonationPaymentMethod, DonationStatus } from "@prisma/client";

/**
 * Server-confirmed donation outcomes as aggregate counts only (AF-FUNNEL, server-confirmed half).
 *
 * Input is what `prisma.donation.groupBy({ by: ["paymentMethod", "status"] })` returns, so no donor row, reference, amount,
 * name, contact, IP or token ever reaches this module. Outcomes come from recorded payment status, never from client events.
 * There is deliberately no acquisition attribution here: tying a visit to a gift needs a consented event store.
 *
 * Small cells are suppressed so a count of one or two cannot point at a person, and a suppressed cell never leaves a total
 * that would let it be recovered by subtraction.
 */
export const MIN_REPORTABLE_CELL = 5;

export type FunnelStage = "started" | "awaiting" | "confirmed" | "unsuccessful";
export type GroupedDonationCount = { paymentMethod: DonationPaymentMethod; status: DonationStatus; _count: { _all: number } };
/** A count, or `suppressed` when it is between 1 and the minimum cell size. */
export type ReportableCount = { suppressed: false; count: number } | { suppressed: true };
export type FunnelRow = { method: DonationPaymentMethod | "ALL"; cells: Record<FunnelStage, ReportableCount>; confirmedShare: number | null };

const STAGE_OF: Record<DonationStatus, Exclude<FunnelStage, "started">> = {
  CREATED: "awaiting",
  AUTHORIZED: "awaiting",
  PENDING_VERIFICATION: "awaiting",
  CAPTURED: "confirmed",
  // A refund follows a confirmed payment, so it still counts as confirmed here; the refund itself is reported elsewhere.
  REFUNDED: "confirmed",
  FAILED: "unsuccessful",
  REJECTED: "unsuccessful",
};
const STAGES: readonly FunnelStage[] = ["started", "awaiting", "confirmed", "unsuccessful"];
const empty = (): Record<FunnelStage, number> => ({ started: 0, awaiting: 0, confirmed: 0, unsuccessful: 0 });

function rowFrom(method: FunnelRow["method"], raw: Record<FunnelStage, number>, minCell: number): FunnelRow {
  const small = STAGES.filter(stage => raw[stage] > 0 && raw[stage] < minCell);
  // started = awaiting + confirmed + unsuccessful. Even two suppressed stages can be reconstructed when their
  // sum is two: both must be one. Suppress the derived total whenever a component is hidden. Keep complementary
  // suppression of one additional positive stage as a separate safeguard against very small populations.
  const hidden = new Set<FunnelStage>(small);
  if (hidden.size === 1) {
    const others = STAGES.filter(stage => !hidden.has(stage) && raw[stage] > 0).sort((a, b) => raw[a] - raw[b]);
    if (others[0]) hidden.add(others[0]);
  }
  if (hidden.size > 0) hidden.add("started");
  const cells = Object.fromEntries(STAGES.map(stage => [stage, hidden.has(stage) ? { suppressed: true } : { suppressed: false, count: raw[stage] }])) as FunnelRow["cells"];
  // A share is only meaningful, and only safe, when nothing in the row is hidden and the base is large enough.
  const confirmedShare = hidden.size === 0 && raw.started >= minCell ? Math.round((raw.confirmed / raw.started) * 1000) / 10 : null;
  return { method, cells, confirmedShare };
}

export function summariseDonationFunnel(groups: readonly GroupedDonationCount[], minCell: number = MIN_REPORTABLE_CELL): FunnelRow[] {
  // Callers may strengthen suppression, but cannot lower the privacy floor.
  if (!Number.isSafeInteger(minCell) || minCell < MIN_REPORTABLE_CELL) {
    throw new RangeError("Donation funnel requires a safe integer cell threshold of at least five");
  }
  const byMethod = new Map<DonationPaymentMethod, Record<FunnelStage, number>>();
  const all = empty();
  for (const group of groups) {
    const count = group._count._all;
    if (!Number.isSafeInteger(count) || count <= 0) continue;
    const stage = STAGE_OF[group.status];
    if (!stage) continue;
    const row = byMethod.get(group.paymentMethod) ?? empty();
    row.started += count; row[stage] += count;
    all.started += count; all[stage] += count;
    byMethod.set(group.paymentMethod, row);
  }
  const rows = [...byMethod.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([method, raw]) => rowFrom(method, raw, minCell));
  // The all-methods row is added only when it cannot be subtracted against the per-method rows to expose a hidden cell.
  const anyHidden = rows.some(row => STAGES.some(stage => row.cells[stage].suppressed));
  return anyHidden || rows.length < 2 ? rows : [rowFrom("ALL", all, minCell), ...rows];
}
