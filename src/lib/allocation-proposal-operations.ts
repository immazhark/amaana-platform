import "server-only";
import { assertAllocationReversalAllowed, parseAllocationReversalReason } from "@/lib/allocation-reversal";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import {
  AllocationError, allocationAvailablePaise, assertAllocationReview,
  parseAllocationNote, parseAllocationPaise,
} from "@/lib/allocation-proposals";

/** Independent rollout gate. This application never initiates disbursements
 * or posts bank ledger movements from allocation proposal actions. */
export const allocationPlanningEnabled = () =>
  process.env.AMAANA_ALLOCATION_PLANNING_ENABLED === "true";

const validId = (id: unknown): id is string =>
  typeof id === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(id);

function assertEnabled() {
  if (!allocationPlanningEnabled()) throw new AllocationError("Allocation planning is not enabled.");
}

export async function createAllocationProposal(input: {
  donationId: string; amount: string; purposeNote: string; actorId: string;
}) {
  assertEnabled();
  if (!validId(input.donationId) || !validId(input.actorId)) {
    throw new AllocationError("An existing donation and authorized staff member are required.");
  }
  const amountPaise = parseAllocationPaise(input.amount);
  const purposeNote = parseAllocationNote(input.purposeNote);
  return withSerializableTransactionRetry(async tx => {
    const source = await tx.donation.findUnique({
      where: { id: input.donationId },
      select: {
        id: true, appealId: true, fundId: true, currency: true, status: true,
        amount: true, refundedAmount: true, givingIntent: true, designationSnapshot: true,
        domesticConfirmedAt: true, fundDisclosureConfirmedAt: true,
        fund: { select: { status: true } },
      },
    });
    if (!source || !source.fundId || source.fund?.status !== "APPROVED") {
      throw new AllocationError("Only a currently approved, original-purpose giving fund can be proposed.");
    }
    const approved = await tx.donationAllocationProposal.findMany({
      where: { donationId: source.id, status: "APPROVED" },
      select: { amountPaise: true, reversal: { select: { id: true } } },
    });
    const available = allocationAvailablePaise(source, approved.filter(row => row.reversal === null).map(row => row.amountPaise));
    if (amountPaise > available) throw new AllocationError("Proposed amount exceeds unallocated retained funds.");
    // Duplicate form submissions should not fabricate additional finance
    // tasks. Serializable predicate reads make concurrent identical attempts
    // converge on the first pending proposal after retry.
    const existingPending = await tx.donationAllocationProposal.findFirst({
      where: {
        donationId: source.id, fundId: source.fundId,
        givingIntent: source.givingIntent, amountPaise, purposeNote,
        createdById: input.actorId, status: "PENDING",
      },
      select: { id: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
    if (existingPending) return existingPending.id;
    // Pending proposals do not reserve money. Checker performs the same
    // accounting computation atomically, and rejects stale proposals.
    const created = await tx.donationAllocationProposal.create({
      data: {
        donationId: source.id, fundId: source.fundId,
        givingIntent: source.givingIntent, amountPaise, purposeNote,
        createdById: input.actorId, status: "PENDING",
      }, select: { id: true },
    });
    await tx.auditEvent.create({
      data: {
        actorId: input.actorId, entityType: "DonationAllocationProposal", entityId: created.id,
        action: "ALLOCATION_PROPOSAL_CREATED",
        metadata: { donationId: source.id, fundId: source.fundId, amountPaise, givingIntent: source.givingIntent },
      },
    });
    return created.id;
  });
}

export async function reviewAllocationProposal(input: {
  proposalId: string; decision: "APPROVE" | "REJECT"; actorId: string;
}) {
  assertEnabled();
  if (!validId(input.proposalId) || !validId(input.actorId) ||
      (input.decision !== "APPROVE" && input.decision !== "REJECT")) {
    throw new AllocationError("Invalid proposed allocation review.");
  }
  return withSerializableTransactionRetry(async tx => {
    const proposal = await tx.donationAllocationProposal.findUnique({
      where: { id: input.proposalId },
      select: { id: true, donationId: true, fundId: true, givingIntent: true,
        amountPaise: true, status: true, createdById: true },
    });
    if (!proposal) throw new AllocationError("Proposal unavailable.");
    assertAllocationReview(input.actorId, proposal.createdById, proposal.status);
    if (input.decision === "APPROVE") {
      const source = await tx.donation.findUnique({
        where: { id: proposal.donationId },
        select: {
          id: true, appealId: true, fundId: true, status: true,
          amount: true, refundedAmount: true, currency: true,
          givingIntent: true, designationSnapshot: true, updatedAt: true,
          domesticConfirmedAt: true, fundDisclosureConfirmedAt: true,
          fund: { select: { status: true } },
        },
      });
      if (!source || source.fundId !== proposal.fundId ||
          source.givingIntent !== proposal.givingIntent ||
          source.fund?.status !== "APPROVED") {
        throw new AllocationError("Original donor allocation purpose changed or needs review.");
      }
      const approved = await tx.donationAllocationProposal.findMany({
        where: { donationId: proposal.donationId, status: "APPROVED" },
        select: { amountPaise: true, reversal: { select: { id: true } } },
      });
      if (proposal.amountPaise > allocationAvailablePaise(source, approved.filter(row => row.reversal === null).map(row => row.amountPaise))) {
        throw new AllocationError("Proposal exceeds retained, currently unallocated donation funds.");
      }
      // Lock the donation row with a compare-and-swap. Concurrent refunds or
      // settlement transitions must not silently invalidate this snapshot.
      const guarded = await tx.donation.updateMany({
        where: { id: source.id, status: "CAPTURED", updatedAt: source.updatedAt, refundedAmount: 0 },
        data: { updatedAt: new Date() },
      });
      if (guarded.count !== 1) throw new AllocationError("Donation changed during allocation review.");
    }
    const updated = await tx.donationAllocationProposal.updateMany({
      where: { id: proposal.id, status: "PENDING", createdById: proposal.createdById },
      data: { status: input.decision === "APPROVE" ? "APPROVED" : "REJECTED",
        reviewedById: input.actorId, reviewedAt: new Date() },
    });
    if (updated.count !== 1) throw new AllocationError("Proposal was already reviewed.");
    await tx.auditEvent.create({
      data: {
        actorId: input.actorId, entityType: "DonationAllocationProposal", entityId: proposal.id,
        action: input.decision === "APPROVE" ? "ALLOCATION_PROPOSAL_APPROVED" : "ALLOCATION_PROPOSAL_REJECTED",
        metadata: { donationId: proposal.donationId, fundId: proposal.fundId,
          amountPaise: proposal.amountPaise, givingIntent: proposal.givingIntent },
      },
    });
    return input.decision === "APPROVE" ? "APPROVED" as const : "REJECTED" as const;
  });
}

/** Reversal is a separate immutable entry, never an update or DELETE of
 * a previously approved allocation. It changes the internal available
 * planning balance but is NOT a refund, transfer or beneficiary payout. */
export async function reverseAllocationProposal(input: {
  proposalId: string; reason: string; actorId: string;
}) {
  assertEnabled();
  if (!validId(input.proposalId) || !validId(input.actorId)) {
    throw new AllocationError("Invalid reversal identity.");
  }
  const reason = parseAllocationReversalReason(input.reason);
  return withSerializableTransactionRetry(async tx => {
    const proposal = await tx.donationAllocationProposal.findUnique({
      where: { id: input.proposalId },
      select: {
        id: true, createdById: true, reviewedById: true, status: true,
        donationId: true, fundId: true, amountPaise: true,
        reversal: { select: { id: true } },
      },
    });
    if (!proposal) throw new AllocationError("Allocation proposal not found.");
    assertAllocationReversalAllowed(proposal, input.actorId);
    const entry = await tx.donationAllocationReversal.create({
      data: {
        proposalId: proposal.id, reversedById: input.actorId, reason,
      },
      select: { id: true },
    });
    // Unique(proposalId) makes a concurrent second reversal fail closed.
    // The insert and audit are one serializable unit of work.
    await tx.auditEvent.create({
      data: {
        actorId: input.actorId, action: "ALLOCATION_PROPOSAL_REVERSED",
        entityType: "DonationAllocationReversal", entityId: entry.id,
        metadata: { proposalId: proposal.id, donationId: proposal.donationId,
          fundId: proposal.fundId, amountPaise: proposal.amountPaise },
      },
    });
    return entry.id;
  });
}
