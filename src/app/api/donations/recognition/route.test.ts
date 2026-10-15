import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enabled: vi.fn(), origin: vi.fn(), allow: vi.fn(), lookup: vi.fn(),
  state: vi.fn(), update: vi.fn(), audit: vi.fn(), transaction: vi.fn(), revalidate: vi.fn(),
}));
vi.mock("@/lib/donor-recognition-repository", () => ({
  donorRecognitionEnabled: mocks.enabled,
  findDonorRecognitionByReceipt: mocks.lookup,
  privateRecognitionState: mocks.state,
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: mocks.origin, enforceAcknowledgementRateLimit: mocks.allow,
}));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: mocks.transaction }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return { RequestBodyTooLargeError, readTextBodyWithLimit: async (request: Request, max: number) => {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > max) throw new RequestBodyTooLargeError();
    return text;
  }};
});
import { POST } from "./route";

const reference = "AMN-RECEIPT-12345", token = "secret-private-receipt-token-long";
const record = {
  id: "donation-id", status: "CAPTURED", isAnonymous: false,
  refundedAmount: { toNumber: () => 0 },
  recognitionDisplayName: null, recognitionRequestedAt: null,
  recognitionApprovedAt: null, recognitionRevokedAt: null,
};
function request(action = "status", extra: Record<string, unknown> = {}) {
  return new Request("https://amaana.example/api/donations/recognition", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference, token, action, ...extra }),
  });
}

describe("donor-recognition capability and consent boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enabled.mockReturnValue(true);
    mocks.origin.mockReturnValue(true);
    mocks.allow.mockResolvedValue(true);
    mocks.lookup.mockResolvedValue(record);
    mocks.state.mockReturnValue("inactive");
    mocks.update.mockResolvedValue({ count: 1 });
    mocks.audit.mockResolvedValue({ id: "consent-event" });
    mocks.transaction.mockImplementation(async callback => callback({
      donation: { updateMany: mocks.update },
      donorRecognitionConsentEvent: { create: mocks.audit },
    }));
  });
  it("is disabled by default until the database migration and review gate are enabled", async () => {
    mocks.enabled.mockReturnValue(false);
    const result = await POST(request("request", { name: "Ayesha Khan" }));
    expect(result.status).toBe(503);
    expect(mocks.lookup).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("blocks cross-origin access before receipt reads", async () => {
    mocks.origin.mockReturnValue(false);
    const result = await POST(request("status"));
    expect(result.status).toBe(403);
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it("blocks brute-force attempts before receipt reads", async () => {
    mocks.allow.mockResolvedValue(false);
    const result = await POST(request("status"));
    expect(result.status).toBe(429);
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it("rejects malformed and oversized JSON without reaching private donations", async () => {
    const malformed = new Request("https://amaana.example/api/donations/recognition", {
      method: "POST", body: "{", headers: { "Content-Type": "application/json" },
    });
    expect((await POST(malformed)).status).toBe(400);
    expect((await POST(request("status", { padding: "x".repeat(4500) }))).status).toBe(413);
    expect(mocks.lookup).not.toHaveBeenCalled();
  });
  it("denies unknown receipt credentials without revealing donor details", async () => {
    mocks.lookup.mockResolvedValue(null);
    const result = await POST(request("status"));
    expect(result.status).toBe(404);
    expect(JSON.stringify(await result.json())).not.toContain("donorEmail");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it.each([
    { status: "PENDING_VERIFICATION" },
    { status: "REFUNDED" },
    { isAnonymous: true },
    { refundedAmount: { toNumber: () => 1 } },
  ])("never accepts a public name when the donation is not eligible %o", async patch => {
    mocks.lookup.mockResolvedValue({ ...record, ...patch });
    const result = await POST(request("request", { name: "Ayesha Khan" }));
    expect(result.status).toBe(409);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("requires a separately supplied safe display name", async () => {
    const result = await POST(request("request", { name: "contact@example.com" }));
    expect(result.status).toBe(400);
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("records new consent only as pending, never as immediate publication", async () => {
    const result = await POST(request("request", { name: "Ayesha Khan" }));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ state: "pending", name: "Ayesha Khan", revocable: true });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "CAPTURED", isAnonymous: false, refundedAmount: 0 }),
      data: expect.objectContaining({ recognitionDisplayName: "Ayesha Khan", recognitionApprovedAt: null, recognitionRevokedAt: null }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith({ data: {
      donationId: "donation-id", action: "REQUESTED",
    } });
    expect(mocks.revalidate).toHaveBeenCalledWith("/shukr");
    expect(mocks.update.mock.calls[0][0].where).toMatchObject({
      recognitionRequestedAt: null, recognitionApprovedAt: null, recognitionRevokedAt: null,
    });
  });
  it("allows withdrawing prior recognition even after the donation becomes ineligible", async () => {
    mocks.lookup.mockResolvedValue({ ...record, status: "REFUNDED",
      recognitionDisplayName: "Ayesha Khan",
      recognitionRequestedAt: new Date("2026-10-10T12:00:00Z"),
      recognitionApprovedAt: new Date("2026-10-11T12:00:00Z") });
    mocks.state.mockReturnValue("unavailable");
    const result = await POST(request("status"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      state: "unavailable", name: "Ayesha Khan", revocable: true,
    });
  });

  it("keeps an empty/inactive withdrawal idempotent without writing misleading audit events", async () => {
    const response = await POST(request("withdraw"));
    expect(response.status).toBe(200);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it.each(["request", "withdraw"])("fails closed on a stale %s consent version without audit or cache invalidation", async action => {
    mocks.update.mockResolvedValue({ count: 0 });
    mocks.lookup.mockResolvedValue({ ...record, recognitionDisplayName: "Previously Approved",
      recognitionRequestedAt: new Date("2026-10-10T10:00:00Z") });
    const response = await POST(request(action, action === "request" ? { name: "New Name" } : {}));
    expect(response.status).toBe(409);
    expect(mocks.audit).not.toHaveBeenCalled();
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });
  it("does not acknowledge a consent change if writing the history fails", async () => {
    mocks.audit.mockRejectedValue(new Error("history unavailable"));
    const result = await POST(request("request", { name: "Ayesha Khan" }));
    expect(result.status).toBe(503);
    expect(mocks.revalidate).not.toHaveBeenCalled();
  });

  it("withdraws previously approved names without requiring capture eligibility again", async () => {
    mocks.lookup.mockResolvedValue({ ...record, status: "REFUNDED", recognitionDisplayName: "Ayesha Khan", recognitionRequestedAt: new Date("2026-10-11T10:00:00Z") });
    const result = await POST(request("withdraw"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ state: "inactive", name: "", revocable: false });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        recognitionApprovedAt: null, recognitionRequestedAt: null,
        recognitionDisplayName: null, recognitionRevokedAt: expect.any(Date),
      }),
    }));
    expect(mocks.audit).toHaveBeenCalledWith({ data: {
      donationId: "donation-id", action: "WITHDRAWN",
    } });
    expect(result.headers.get("cache-control")).toContain("no-store");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
  });
});
