import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  donateFind: vi.fn(), donateUpdate: vi.fn(),
  proposalFind: vi.fn(), proposalList: vi.fn(), proposalCreate: vi.fn(), proposalUpdate: vi.fn(),
  audit: vi.fn(), transaction: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
import { AllocationError } from "./allocation-proposals";
import {
  allocationPlanningEnabled, createAllocationProposal, reviewAllocationProposal,
} from "./allocation-proposal-operations";

const dec = (amount: number) => ({ mul: (factor: number) => ({ toNumber: () => amount * factor }) });
const donation = {
  id: "donation-record-001", appealId: null, fundId: "approved-fund-id",
  status: "CAPTURED", amount: dec(500), refundedAmount: dec(0), currency: "INR",
  updatedAt: new Date("2026-10-15T07:00:00.000Z"), givingIntent: "GENERAL",
  designationSnapshot: {
    version: 1, kind: "FUND", fundId: "approved-fund-id", fundRevision: 2,
    label: "Original approved programme",
    purpose: "Specific purpose agreed by independent programme reviewers.",
    disclosure: "Donor approved usage restrictions for this giving fund.",
    accountCode: "FUND-A", givingIntent: "GENERAL",
  },
  fund: { status: "APPROVED" },
};
const proposal = {
  id: "allocation-proposal-0001", donationId: donation.id,
  fundId: donation.fundId, givingIntent: "GENERAL",
  amountPaise: 32000, createdById: "finance-maker-id",
  status: "PENDING",
};
function harness() {
  return {
    donation: { findUnique: mocks.donateFind, updateMany: mocks.donateUpdate },
    donationAllocationProposal: {
      findUnique: mocks.proposalFind, findMany: mocks.proposalList,
      create: mocks.proposalCreate, updateMany: mocks.proposalUpdate,
    },
    auditEvent: { create: mocks.audit },
  };
}
describe("allocation proposals never move funds and cannot bypass second approval", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AMAANA_ALLOCATION_PLANNING_ENABLED", "true");
    mocks.transaction.mockImplementation(async callback => callback(harness()));
    mocks.donateFind.mockResolvedValue(donation);
    mocks.donateUpdate.mockResolvedValue({ count: 1 });
    mocks.proposalFind.mockResolvedValue(proposal);
    mocks.proposalList.mockResolvedValue([]);
    mocks.proposalUpdate.mockResolvedValue({ count: 1 });
    mocks.proposalCreate.mockResolvedValue({ id: proposal.id });
    mocks.audit.mockResolvedValue({ id: "audit-event" });
  });

  it("defaults to disabled without rollout authorization", async () => {
    vi.stubEnv("AMAANA_ALLOCATION_PLANNING_ENABLED", "");
    expect(allocationPlanningEnabled()).toBe(false);
    await expect(createAllocationProposal({
      donationId: donation.id, actorId: "finance-maker-id",
      amount: "125.00", purposeNote: "Approved programme supplies",
    })).rejects.toBeInstanceOf(AllocationError);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("creates a bounded PENDING proposal, not a debit or disbursement", async () => {
    const id = await createAllocationProposal({
      donationId: donation.id, actorId: "finance-maker-id",
      amount: "125.05", purposeNote: "Approved programme education materials",
    });
    expect(id).toBe(proposal.id);
    expect(mocks.proposalCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        amountPaise: 12505, status: "PENDING", fundId: donation.fundId,
        givingIntent: "GENERAL", createdById: "finance-maker-id",
      }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ALLOCATION_PROPOSAL_CREATED" }),
    }));
    expect(mocks.donateUpdate).not.toHaveBeenCalled();
  });

  it("refuses proposal creation from unreconciled, refunded or wrong-purpose donations", async () => {
    for (const patch of [
      { status: "PENDING_VERIFICATION" }, { refundedAmount: dec(1) },
      { designationSnapshot: null }, { fundId: null }, { fund: { status: "DRAFT" } },
      { appealId: "appeal-id", fundId: null }, { givingIntent: "ZAKAT" },
    ]) {
      mocks.donateFind.mockResolvedValueOnce({ ...donation, ...patch });
      await expect(createAllocationProposal({
        donationId: donation.id, actorId: "finance-maker-id",
        amount: "25", purposeNote: "Approved programme supplies",
      })).rejects.toThrow();
    }
    expect(mocks.proposalCreate).not.toHaveBeenCalled();
  });

  it("blocks an independent reviewer from approving more than the available donation balance", async () => {
    mocks.proposalList.mockResolvedValue([{ amountPaise: 19000, reversal: null }]);
    await expect(reviewAllocationProposal({
      proposalId: proposal.id, actorId: "other-finance-checker",
      decision: "APPROVE",
    })).rejects.toBeInstanceOf(AllocationError);
    expect(mocks.proposalUpdate).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("excludes separately reversed approved allocations from the planning balance", async () => {
    mocks.proposalList.mockResolvedValue([
      { amountPaise: 35000, reversal: { id: "reversal-0001" } },
      { amountPaise: 1000, reversal: null },
    ]);
    const result = await reviewAllocationProposal({
      proposalId: proposal.id, actorId: "other-finance-checker",
      decision: "APPROVE",
    });
    expect(result).toBe("APPROVED");
    expect(mocks.proposalUpdate).toHaveBeenCalledTimes(1);
  });

  it("blocks creator self-approval and terminal replay", async () => {
    await expect(reviewAllocationProposal({
      proposalId: proposal.id, actorId: proposal.createdById, decision: "APPROVE",
    })).rejects.toBeInstanceOf(AllocationError);
    mocks.proposalFind.mockResolvedValueOnce({ ...proposal, status: "REJECTED" });
    await expect(reviewAllocationProposal({
      proposalId: proposal.id, actorId: "finance-checker-id", decision: "APPROVE",
    })).rejects.toBeInstanceOf(AllocationError);
    expect(mocks.donateUpdate).not.toHaveBeenCalled();
  });

  it("atomically rechecks original designation and locks source before approval", async () => {
    const result = await reviewAllocationProposal({
      proposalId: proposal.id, actorId: "finance-checker-id", decision: "APPROVE",
    });
    expect(result).toBe("APPROVED");
    expect(mocks.donateUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: donation.id, status: "CAPTURED", refundedAmount: 0,
        updatedAt: donation.updatedAt,
      }),
    }));
    expect(mocks.proposalUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: proposal.id, status: "PENDING" }),
      data: expect.objectContaining({ status: "APPROVED", reviewedById: "finance-checker-id" }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ALLOCATION_PROPOSAL_APPROVED" }),
    }));
  });

  it("fails closed on concurrent refund/source update or a changed original intent", async () => {
    mocks.donateUpdate.mockResolvedValueOnce({ count: 0 });
    await expect(reviewAllocationProposal({
      proposalId: proposal.id, actorId: "finance-checker-id", decision: "APPROVE",
    })).rejects.toThrow("changed");
    mocks.donateFind.mockResolvedValueOnce({ ...donation, designationSnapshot: null });
    await expect(reviewAllocationProposal({
      proposalId: proposal.id, actorId: "finance-checker-id", decision: "APPROVE",
    })).rejects.toThrow();
    expect(mocks.proposalUpdate).not.toHaveBeenCalled();
  });

  it("rejects without locking or changing the donation, but still audits independent review", async () => {
    const result = await reviewAllocationProposal({
      proposalId: proposal.id, actorId: "finance-checker-id", decision: "REJECT",
    });
    expect(result).toBe("REJECTED");
    expect(mocks.donateUpdate).not.toHaveBeenCalled();
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ALLOCATION_PROPOSAL_REJECTED" }),
    }));
  });
});
