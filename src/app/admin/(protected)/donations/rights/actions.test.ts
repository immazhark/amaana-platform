import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  require: vi.fn(), enabled: vi.fn(), transaction: vi.fn(),
  update: vi.fn(), audit: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.require }));
vi.mock("@/lib/donor-rights-repository", () => ({ donorRightsEnabled: mocks.enabled }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/prisma-transaction", () => ({
  withSerializableTransactionRetry: mocks.transaction,
}));
import { reviewDonorRightsAction } from "./actions";

const before = { state: "idle" as const, message: "" };
function form(decision: string, confirmed = false) {
  const value = new FormData();
  value.set("requestId", "private-request-1234");
  value.set("decision", decision);
  if (confirmed) { value.set("reviewConfirmed", "true"); value.set("resolution", "PRIVATE_FOLLOW_UP_COMPLETED"); }
  return value;
}
describe("authorized donor data review transitions", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.require.mockResolvedValue({ id: "staff-1" });
    mocks.enabled.mockReturnValue(true);
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.audit.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (operation: (tx: unknown) => Promise<unknown>) =>
      operation({ donorRightsRequest: { updateMany: mocks.update },
        auditEvent: { create: mocks.audit } }));
  });
  it.each(["START_REVIEW", "CLOSE_REVIEW"])("reports committed %s truthfully if refreshing fails", async decision => {
    mocks.revalidate.mockImplementation(() => { throw new Error("Cache unavailable"); });
    const result = await reviewDonorRightsAction(before, form(decision, true));
    expect(result.state).toBe("success");
    expect(result.message).toContain("Your review was saved");
    expect(mocks.audit).toHaveBeenCalledTimes(1);
  });
  it("never treats an audit write failure as a saved review", async () => {
    mocks.audit.mockRejectedValue(new Error("Audit failed"));
    expect((await reviewDonorRightsAction(before, form("START_REVIEW"))).state).toBe("error");
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("requires a staff donation reconciliation permission", async () => {
    await reviewDonorRightsAction(before, form("START_REVIEW"));
    expect(mocks.require).toHaveBeenCalledWith("donation.reconcile");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "private-request-1234", status: "OPEN" },
      data: expect.objectContaining({ status: "IN_REVIEW", reviewedById: "staff-1" }),
    }));
    expect(mocks.update.mock.calls[0]?.[0].data).not.toHaveProperty("reviewedAt");
  });
  it("never swallows authorization failures or changes records for forbidden users", async () => {
    mocks.require.mockRejectedValue(new Error("Forbidden"));
    await expect(reviewDonorRightsAction(before, form("START_REVIEW"))).rejects.toThrow("Forbidden");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not close a rights review without affirmative staff attestation", async () => {
    expect((await reviewDonorRightsAction(before, form("CLOSE_REVIEW"))).state).toBe("error");
    expect(mocks.transaction).not.toHaveBeenCalled();
    const result = await reviewDonorRightsAction(before, form("CLOSE_REVIEW", true));
    expect(result.state).toBe("success");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "private-request-1234", status: "IN_REVIEW" },
      data: expect.objectContaining({ status: "CLOSED", reviewedAt: expect.any(Date) }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "DONOR_RIGHTS_REVIEW_CLOSED" }),
    }));
  });
  it("rejects arbitrary review outcomes instead of recording unstructured sensitive evidence", async () => {
    const untrusted = form("CLOSE_REVIEW", true);
    untrusted.set("resolution", "DELETE_ALL_RECORDS");
    const result = await reviewDonorRightsAction(before, untrusted);
    expect(result.state).toBe("error");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("audits the controlled outcome without donor documents or free text", async () => {
    await reviewDonorRightsAction(before, form("CLOSE_REVIEW", true));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        metadata: { resultingStatus: "CLOSED", reviewOutcome: "PRIVATE_FOLLOW_UP_COMPLETED" },
      }),
    }));
  });
  it("prevents stale second approvals and audits only a committed transition", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    const result = await reviewDonorRightsAction(before, form("START_REVIEW"));
    expect(result.state).toBe("error");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("does not permit review actions while the feature is disabled", async () => {
    mocks.enabled.mockReturnValue(false);
    expect((await reviewDonorRightsAction(before, form("START_REVIEW"))).state).toBe("error");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each(["requestId", "decision", "reviewConfirmed", "resolution"])("rejects repeated %s before a transaction", async field => {
    for (const duplicate of ["same", "different", "file"]) {
      const data = form("CLOSE_REVIEW", true);
      data.append(field, duplicate === "file" ? new File(["private"], "private.txt") : duplicate === "same" ? String(data.get(field)) : "CONFLICT");
      expect((await reviewDonorRightsAction(before, data)).state).toBe("error");
      expect(mocks.transaction).not.toHaveBeenCalled();
    }
  });

});
