import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), enabled: vi.fn(), create: vi.fn(), review: vi.fn(), reverse: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("next/cache", () => ({ revalidatePath: m.refresh }));
vi.mock("@/lib/allocation-proposal-operations", () => ({
  allocationPlanningEnabled: m.enabled, createAllocationProposal: m.create,
  reviewAllocationProposal: m.review, reverseAllocationProposal: m.reverse,
}));
import { createAllocationAction, reviewAllocationAction, reverseAllocationAction } from "./actions";
const initial = { state: "idle" as const, message: "" };
const cases = [
  { name: "create", action: createAllocationAction, operation: m.create, permission: "fund.manage", outcome: "proposal-id" },
  { name: "review", action: reviewAllocationAction, operation: m.review, permission: "fund.approve", outcome: "REJECTED" },
  { name: "reverse", action: reverseAllocationAction, operation: m.reverse, permission: "fund.approve", outcome: "reversal-id" },
];
const form = () => {
  const data = new FormData();
  data.set("donationId", "donation-id"); data.set("proposalId", "proposal-id");
  data.set("decision", "REJECT"); data.set("amount", "100.25");
  data.set("purposeNote", "Approved programme supplies"); data.set("reason", "Independent reconciliation correction");
  return data;
};
describe("allocation commit and view-refresh boundaries", () => {
  beforeEach(() => {
    vi.resetAllMocks(); m.enabled.mockReturnValue(true); m.permission.mockResolvedValue({ id: "reviewer-id" });
    for (const row of cases) row.operation.mockResolvedValue(row.outcome);
  });
  for (const row of cases) {
    it(`${row.name}: retains committed success when every refresh fails and attempts all affected views`, async () => {
      m.refresh.mockImplementation(() => { throw new Error("Cache unavailable"); });
      const result = await row.action(initial, form());
      expect(result.state).toBe("success");
      expect(result.message).toContain("saved change is recorded");
      expect(row.operation).toHaveBeenCalledTimes(1);
      expect(m.permission).toHaveBeenCalledWith(row.permission);
      expect(m.refresh.mock.calls).toEqual([
        ["/admin/allocations"], ["/admin/giving-funds"], ["/admin/donations/[id]", "page"],
      ]);
      expect(Number(row.operation.mock.invocationCallOrder[0])).toBeLessThan(Number(m.refresh.mock.invocationCallOrder[0]));
    });
    it(`${row.name}: propagates authorization rejection without mutation or refresh`, async () => {
      m.permission.mockRejectedValue(new Error("Forbidden"));
      await expect(row.action(initial, form())).rejects.toThrow("Forbidden");
      expect(row.operation).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
    });
    it(`${row.name}: keeps transaction/audit failures fatal without refreshing`, async () => {
      row.operation.mockRejectedValue(new Error("Transaction rolled back"));
      expect((await row.action(initial, form())).state).toBe("error");
      expect(m.refresh).not.toHaveBeenCalled();
    });
    it(`${row.name}: stays disabled behind the server gate`, async () => {
      m.enabled.mockReturnValue(false);
      expect((await row.action(initial, form())).state).toBe("error");
      expect(row.operation).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
    });
  }
  it("reports normal success without a refresh warning", async () => {
    const result = await reviewAllocationAction(initial, form());
    expect(result.state).toBe("success"); expect(result.message).not.toContain("refresh failed");
  });
  it("rejects forged review decisions before mutation", async () => {
    const data = form(); data.set("decision", "TRANSFER");
    expect((await reviewAllocationAction(initial, data)).state).toBe("error");
    expect(m.review).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
  });
});
