import { AllocationError, parseAllocationNote } from "@/lib/allocation-proposals";

/** A historical approved proposal remains immutable. A distinct append-only
 * reversal is its only recognized correction in this planning ledger. */
export function parseAllocationReversalReason(value: unknown) {
  const reason = parseAllocationNote(value);
  if (reason.length < 20) throw new AllocationError("Provide at least 20 characters explaining the reversal.");
  return reason;
}
export function assertAllocationReversalAllowed(source: {
  status: string; createdById: string; reviewedById: string | null;
  reversal: { id: string } | null;
}, actorId: string) {
  if (!actorId || actorId === source.createdById ||
      actorId === source.reviewedById || source.status !== "APPROVED" ||
      source.reversal !== null) {
    throw new AllocationError("A separately authorized staff member may reverse one approved allocation exactly once.");
  }
}
