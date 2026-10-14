import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  permission: vi.fn(), reconcile: vi.fn(), path: vi.fn(), tag: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: m.permission }));
vi.mock("@/lib/direct-donation-reconciliation", () => ({ reconcileDirectDonation: m.reconcile }));
vi.mock("next/cache", () => ({ revalidatePath: m.path, updateTag: m.tag }));
import { reconcileDonationAction, type DonationReconciliationState } from "./actions";

const initial: DonationReconciliationState = { status: "idle", message: "" };
function form(decision = "VERIFY") {
  const data = new FormData();
  data.set("donationId", "synthetic-donation");
  data.set("decision", decision);
  data.set("notes", "Bank entry independently matched");
  data.set("statementReference", "UTR-TEST-12345");
  data.set("statementAmount", "500.00");
  data.set("statementConfirmed", "true");
  return data;
}

describe("manual reconciliation staff feedback and derived-view refresh", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    m.permission.mockResolvedValue({ id: "synthetic-operator" });
    m.reconcile.mockResolvedValue({ status: "CAPTURED", referenceNumber: "AFD-SYNTHETIC" });
  });

  it("refreshes derived balances only after financial reconciliation completes", async () => {
    m.reconcile.mockImplementation(async () => {
      expect(m.tag).not.toHaveBeenCalled();
      expect(m.path).not.toHaveBeenCalled();
      return { status: "CAPTURED", referenceNumber: "AFD-SYNTHETIC" };
    });
    const result = await reconcileDonationAction(initial, form());
    expect(result).toMatchObject({ status: "success" });
    expect(m.permission).toHaveBeenCalledWith("donation.reconcile");
    expect(m.reconcile).toHaveBeenCalledExactlyOnceWith({
      donationId: "synthetic-donation", actorId: "synthetic-operator",
      decision: "VERIFY", notes: "Bank entry independently matched",
      statementReference: "UTR-TEST-12345", statementAmount: "500.00", statementConfirmed: true,
    });
    expect(m.tag).toHaveBeenCalledExactlyOnceWith("appeals");
    for (const path of ["/admin/donations", "/admin/donations/synthetic-donation",
      "/admin/giving-funds", "/appeals", "/"]) {
      expect(m.path).toHaveBeenCalledWith(path);
    }
  });

  it("refreshes private views for rejection without expiring public fundraising", async () => {
    m.reconcile.mockResolvedValueOnce({ status: "REJECTED", referenceNumber: "AFD-SYNTHETIC" });
    const input = form("REJECT");
    input.delete("statementReference");
    input.delete("statementAmount");
    input.delete("statementConfirmed");
    const outcome = await reconcileDonationAction(initial, input);
    expect(outcome.status).toBe("success");
    expect(outcome.message).toContain("No donation amount was credited");
    expect(m.reconcile).toHaveBeenCalledWith(expect.objectContaining({
      decision: "REJECT", statementReference: "", statementAmount: "", statementConfirmed: false,
    }));
    expect(m.path).toHaveBeenCalledWith("/admin/donations");
    expect(m.path).toHaveBeenCalledWith("/admin/giving-funds");
    expect(m.tag).not.toHaveBeenCalled();
    expect(m.path).not.toHaveBeenCalledWith("/appeals");
    expect(m.path).not.toHaveBeenCalledWith("/");
  });

  it("does not invalidate derived views after a failed transaction", async () => {
    m.reconcile.mockRejectedValue(new Error("transaction rolled back with private connection data"));
    const outcome = await reconcileDonationAction(initial, form());
    expect(outcome.status).toBe("error");
    expect(outcome.message).not.toContain("private connection data");
    expect(m.tag).not.toHaveBeenCalled();
    expect(m.path).not.toHaveBeenCalled();
  });

  it("surfaces approved bank-statement errors without private database details", async () => {
    m.reconcile.mockRejectedValueOnce(new Error(
      "This bank transaction reference was already reconciled; investigate duplicate credit",
    ));
    const outcome = await reconcileDonationAction(initial, form());
    expect(outcome.status).toBe("error");
    expect(outcome.message).toContain("already reconciled");
    expect(m.path).not.toHaveBeenCalled();
    expect(m.tag).not.toHaveBeenCalled();
  });

  it("checks permission before reconciliation and does not mask unauthorized access", async () => {
    m.permission.mockRejectedValue(new Error("Forbidden"));
    await expect(reconcileDonationAction(initial, form())).rejects.toThrow("Forbidden");
    expect(m.reconcile).not.toHaveBeenCalled();
    expect(m.path).not.toHaveBeenCalled();
  });

  it("rejects malformed decisions without mutating or invalidating", async () => {
    const outcome = await reconcileDonationAction(initial, form("INVALID"));
    expect(outcome).toMatchObject({ status: "error" });
    expect(m.reconcile).not.toHaveBeenCalled();
    expect(m.tag).not.toHaveBeenCalled();
  });

  it("does not let a missing donation reference reach the database mutation", async () => {
    const input = form();
    input.delete("donationId");
    expect((await reconcileDonationAction(initial, input)).status).toBe("error");
    expect(m.reconcile).not.toHaveBeenCalled();
  });
});
