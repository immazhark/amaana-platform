import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ permission: vi.fn(), reconcile: vi.fn(), path: vi.fn(), tag: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/direct-donation-reconciliation", () => ({ reconcileDirectDonation: m.reconcile }));
vi.mock("next/cache", () => ({ revalidatePath: m.path, updateTag: m.tag }));
import { reconcileDonationAction } from "./actions";
function form(decision = "VERIFY") {
  const data = new FormData();
  data.set("donationId", "synthetic-donation"); data.set("decision", decision);
  data.set("notes", "Bank entry independently matched"); return data;
}
describe("manual reconciliation derived-view refresh", () => {
  beforeEach(() => { vi.resetAllMocks(); m.permission.mockResolvedValue({ id: "operator" }); m.reconcile.mockResolvedValue({ status: "CAPTURED" }); });
  it("refreshes derived balances only after reconciliation completes", async () => {
    m.reconcile.mockImplementation(async () => {
      expect(m.tag).not.toHaveBeenCalled(); expect(m.path).not.toHaveBeenCalled();
      return { status: "CAPTURED" };
    });
    await reconcileDonationAction(form());
    expect(m.permission).toHaveBeenCalledWith("donation.reconcile");
    expect(m.tag).toHaveBeenCalledExactlyOnceWith("appeals");
    for (const path of ["/admin/donations", "/admin/donations/synthetic-donation", "/admin/giving-funds", "/appeals", "/"]) {
      expect(m.path).toHaveBeenCalledWith(path);
    }
  });
  it("refreshes private views for rejection without expiring public fundraising", async () => {
    m.reconcile.mockResolvedValueOnce({ status: "REJECTED" });
    await reconcileDonationAction(form("REJECT"));
    expect(m.path).toHaveBeenCalledWith("/admin/donations");
    expect(m.path).toHaveBeenCalledWith("/admin/giving-funds");
    expect(m.tag).not.toHaveBeenCalled();
    expect(m.path).not.toHaveBeenCalledWith("/appeals");
    expect(m.path).not.toHaveBeenCalledWith("/");
  });
  it("does not invalidate data after a failed financial write", async () => {
    m.reconcile.mockRejectedValue(new Error("transaction rolled back"));
    await expect(reconcileDonationAction(form())).rejects.toThrow("transaction rolled back");
    expect(m.tag).not.toHaveBeenCalled(); expect(m.path).not.toHaveBeenCalled();
  });
  it("checks permission before reconciliation or invalidation", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(reconcileDonationAction(form())).rejects.toThrow("Forbidden");
    expect(m.reconcile).not.toHaveBeenCalled(); expect(m.path).not.toHaveBeenCalled();
  });
  it("rejects malformed decisions without mutating or invalidating", async () => {
    await expect(reconcileDonationAction(form("INVALID"))).rejects.toThrow("Invalid reconciliation request");
    expect(m.reconcile).not.toHaveBeenCalled(); expect(m.tag).not.toHaveBeenCalled();
  });
});
