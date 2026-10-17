import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), find: vi.fn(), reversalCreate: vi.fn(), audit: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.transaction }));
import { reverseAllocationProposal } from "./allocation-proposal-operations";

const original = {
  id: "allocation-proposal-0001",
  donationId: "donation-record-001", fundId: "approved-fund",
  amountPaise: 10000, status: "APPROVED",
  createdById: "fund-maker-001", reviewedById: "fund-checker-001",
  reversal: null,
};
describe("immutable internal allocation reversal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("AMAANA_ALLOCATION_PLANNING_ENABLED", "true");
    mocks.find.mockResolvedValue(original);
    mocks.reversalCreate.mockResolvedValue({ id: "reversal-record-001" });
    mocks.audit.mockResolvedValue({ id: "audit-record-001" });
    mocks.transaction.mockImplementation(async (run: (tx: unknown) => Promise<unknown>) => run({
      donationAllocationProposal: { findUnique: mocks.find },
      donationAllocationReversal: { create: mocks.reversalCreate },
      auditEvent: { create: mocks.audit },
    }));
  });
  it("requires a third independent actor and an approved historical allocation", async () => {
    for (const actorId of [original.createdById, original.reviewedById]) {
      await expect(reverseAllocationProposal({
        proposalId: original.id, actorId,
        reason: "Independent finance governance correction",
      })).rejects.toThrow();
    }
    expect(mocks.reversalCreate).not.toHaveBeenCalled();
  });
  it("creates exactly one new reversal and a staff audit without altering original approval", async () => {
    const id = await reverseAllocationProposal({
      proposalId: original.id, actorId: "other-finance-actor",
      reason: "Independent finance governance correction",
    });
    expect(id).toBe("reversal-record-001");
    expect(mocks.reversalCreate).toHaveBeenCalledWith({
      data: { proposalId: original.id, reversedById: "other-finance-actor",
        reason: "Independent finance governance correction" },
      select: { id: true },
    });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "ALLOCATION_PROPOSAL_REVERSED" }),
    }));
    expect(mocks.find).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ reversal: { select: { id: true } } }),
    }));
  });
  it("will not create second reversals or reverse rejected proposals", async () => {
    mocks.find.mockResolvedValueOnce({ ...original, reversal: { id: "already-reversed" } });
    await expect(reverseAllocationProposal({
      proposalId: original.id, actorId: "third-finance-actor",
      reason: "Independent finance governance correction",
    })).rejects.toThrow();
    mocks.find.mockResolvedValueOnce({ ...original, status: "REJECTED" });
    await expect(reverseAllocationProposal({
      proposalId: original.id, actorId: "third-finance-actor",
      reason: "Independent finance governance correction",
    })).rejects.toThrow();
    expect(mocks.reversalCreate).not.toHaveBeenCalled();
  });
  it("rejects unsafe or insufficient reversal explanations before any transaction", async () => {
    await expect(reverseAllocationProposal({
      proposalId: original.id, actorId: "third-finance-actor", reason: "short",
    })).rejects.toThrow();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
