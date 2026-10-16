import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), enabled: vi.fn(), transaction: vi.fn(), update: vi.fn(), audit: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: m.auth }));
vi.mock("@/lib/donor-recognition-repository", () => ({ donorRecognitionEnabled: m.enabled }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: m.transaction }));
vi.mock("@/lib/shukr-cache-refresh", () => ({ refreshShukrViewsAfterConsent: m.refresh }));
import { reviewDonorRecognitionAction } from "./actions";
const initial = { status: "idle" as const, message: "" };
function form() {
  const data = new FormData();
  data.set("donationId", "donation-synthetic-123"); data.set("requestedAt", "2026-10-12T10:00:00.000Z");
  data.set("name", "Ayesha Khan"); data.set("decision", "APPROVE"); return data;
}
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ id: "staff" }); m.enabled.mockReturnValue(true);
  m.update.mockResolvedValue({ count: 1 }); m.audit.mockResolvedValue({});
  m.transaction.mockImplementation((run: (tx: unknown) => Promise<unknown>) => run({ donation: { updateMany: m.update }, auditEvent: { create: m.audit } }));
});
describe("guarded recognition review", () => {
  it.each(["donationId", "requestedAt", "name", "decision"])("rejects repeated %s before opening a transaction", async key => {
    const data = form(); data.append(key, String(data.get(key)));
    expect((await reviewDonorRecognitionAction(initial, data)).status).toBe("error");
    expect(m.transaction).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
  });
  it.each([" Ayesha Khan ", "Ayesha  Khan", "private@example.org"])("rejects a noncanonical or unsafe name %s", async name => {
    const data = form(); data.set("name", name);
    expect((await reviewDonorRecognitionAction(initial, data)).status).toBe("error");
    expect(m.transaction).not.toHaveBeenCalled();
  });
  it.each(["APPROVE", "REJECT"])("retains transactional eligibility and consent snapshot for %s", async decision => {
    const data = form(); data.set("decision", decision);
    expect((await reviewDonorRecognitionAction(initial, data)).status).toBe("success");
    expect(m.auth).toHaveBeenCalledWith("donation.reconcile");
    expect(m.update.mock.calls[0]?.[0].where).toEqual({
      id: "donation-synthetic-123", status: "CAPTURED", isAnonymous: false, refundedAmount: 0,
      recognitionRequestedAt: new Date("2026-10-12T10:00:00.000Z"), recognitionApprovedAt: null,
      recognitionRevokedAt: null, recognitionDisplayName: "Ayesha Khan",
    });
    expect(m.audit.mock.calls[0]?.[0].data.action).toBe(decision === "APPROVE" ? "DONOR_RECOGNITION_APPROVED" : "DONOR_RECOGNITION_REJECTED");
    expect(m.refresh).toHaveBeenCalledOnce();
  });
  it("does not audit or refresh after consent is withdrawn or another staff action wins", async () => {
    m.update.mockResolvedValue({ count: 0 });
    expect((await reviewDonorRecognitionAction(initial, form())).status).toBe("error");
    expect(m.audit).not.toHaveBeenCalled(); expect(m.refresh).not.toHaveBeenCalled();
  });
  it("keeps authorization and feature gates before any mutation", async () => {
    m.auth.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(reviewDonorRecognitionAction(initial, form())).rejects.toThrow("Forbidden");
    m.enabled.mockReturnValue(false);
    expect((await reviewDonorRecognitionAction(initial, form())).status).toBe("error");
    expect(m.transaction).not.toHaveBeenCalled();
  });
});
