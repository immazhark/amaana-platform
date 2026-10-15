import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), enabled: vi.fn(), transaction: vi.fn(),
  update: vi.fn(), audit: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.auth }));
vi.mock("@/lib/donor-recognition-repository", () => ({ donorRecognitionEnabled: mocks.enabled }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.transaction }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { unpublishDonorRecognitionAction } from "./revoke-action";

const initial = { status: "idle" as const, message: "" };
function data() {
  const form = new FormData();
  form.set("donationId", "private-donation-12345");
  form.set("name", "Ayesha Khan");
  form.set("requestedAt", "2026-10-12T10:00:00.000Z");
  form.set("approvedAt", "2026-10-13T10:00:00.000Z");
  return form;
}
describe("audited staff recognition takedown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ id: "staff-test-id" });
    mocks.enabled.mockReturnValue(true);
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.audit.mockResolvedValue({});
    mocks.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({ donation: { updateMany: mocks.update }, auditEvent: { create: mocks.audit } }));
  });
  it("requires the donation reconciliation permission", async () => {
    const result = await unpublishDonorRecognitionAction(initial, data());
    expect(result.status).toBe("success");
    expect(mocks.auth).toHaveBeenCalledWith("donation.reconcile");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ recognitionDisplayName: "Ayesha Khan", recognitionRevokedAt: null }),
      data: expect.objectContaining({ recognitionApprovedAt: null, recognitionDisplayName: null }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "DONOR_RECOGNITION_UNPUBLISHED" }),
    }));
    expect(mocks.update.mock.calls[0][0].where).not.toHaveProperty("OR");
    expect(mocks.revalidate).toHaveBeenCalledWith("/shukr");
  });
  it("removes a previously pending ineligible name without pretending it was published", async () => {
    const form = data();
    form.set("approvedAt", "");
    const result = await unpublishDonorRecognitionAction(initial, form);
    expect(result.status).toBe("success");
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ recognitionApprovedAt: null,
        recognitionRequestedAt: new Date("2026-10-12T10:00:00.000Z"),
        recognitionDisplayName: "Ayesha Khan", recognitionRevokedAt: null }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "DONOR_RECOGNITION_REQUEST_REMOVED" }),
    }));
    expect(mocks.update.mock.calls[0][0].where.OR).toEqual([
      { status: { not: "CAPTURED" } }, { isAnonymous: true },
      { refundedAmount: { gt: 0 } },
    ]);
  });
  it("does not clear another request after stale removal timestamps or name changes", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    const form = data();
    form.set("approvedAt", "");
    expect((await unpublishDonorRecognitionAction(initial, form)).status).toBe("error");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("does not update records when permission fails or the feature is disabled", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("Forbidden"));
    await expect(unpublishDonorRecognitionAction(initial, data())).rejects.toThrow();
    mocks.enabled.mockReturnValue(false);
    expect((await unpublishDonorRecognitionAction(initial, data())).status).toBe("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not record an audit event for a stale approval", async () => {
    mocks.update.mockResolvedValue({ count: 0 });
    expect((await unpublishDonorRecognitionAction(initial, data())).status).toBe("error");
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
