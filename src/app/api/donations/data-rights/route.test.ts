import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  enabled: vi.fn(), origin: vi.fn(), limit: vi.fn(), capability: vi.fn(),
  read: vi.fn(), open: vi.fn(),
}));
vi.mock("@/lib/donor-rights-repository", () => ({
  donorRightsEnabled: mocks.enabled,
  findDonationRightsCapability: mocks.capability,
  readDonationRightsStatuses: mocks.read,
  openDonationRightsRequest: mocks.open,
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: mocks.origin, enforceAcknowledgementRateLimit: mocks.limit,
}));
vi.mock("@/lib/bounded-request-body", () => {
  class RequestBodyTooLargeError extends Error {}
  return {
    RequestBodyTooLargeError,
    readTextBodyWithLimit: async (request: Request, max: number) => {
      const text = await request.text();
      if (new TextEncoder().encode(text).length > max) throw new RequestBodyTooLargeError();
      return text;
    },
  };
});
import { POST } from "./route";
const reference = "AMN-TEST-DONATION", token = "long-private-test-capability-token";
function req(action: string, extras: Record<string, unknown> = {}) {
  return new Request("https://amaana.example/api/donations/data-rights", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference, token, action, ...extras }),
  });
}
describe("receipt-scoped donor information rights intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enabled.mockReturnValue(true);
    mocks.origin.mockReturnValue(true);
    mocks.limit.mockResolvedValue(true);
    mocks.capability.mockResolvedValue("internal-donation-id");
    mocks.read.mockResolvedValue([]);
    mocks.open.mockResolvedValue({ status: "OPEN", requestedAt: "2026-10-15T05:00:00.000Z" });
  });
  it("fails closed when private rollout is disabled or origin is wrong", async () => {
    mocks.enabled.mockReturnValue(false);
    expect((await POST(req("request", { kind: "ACCESS" }))).status).toBe(503);
    expect(mocks.capability).not.toHaveBeenCalled();
    mocks.enabled.mockReturnValue(true); mocks.origin.mockReturnValue(false);
    expect((await POST(req("request", { kind: "ACCESS" }))).status).toBe(403);
    expect(mocks.capability).not.toHaveBeenCalled();
  });
  it("rate limits before private receipt lookup", async () => {
    mocks.limit.mockResolvedValue(false);
    expect((await POST(req("status"))).status).toBe(429);
    expect(mocks.capability).not.toHaveBeenCalled();
  });
  it("rejects invented kinds, extra fields and oversized payloads", async () => {
    expect((await POST(req("request", { kind: "DELETE_ALL" }))).status).toBe(400);
    expect((await POST(req("request", { kind: "ACCESS", donorEmail: "other@example.org" }))).status).toBe(400);
    expect((await POST(req("request", { kind: "ACCESS", extra: "x".repeat(3000) }))).status).toBe(413);
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it("rejects wrong receipt capability without revealing whether the donation exists", async () => {
    mocks.capability.mockResolvedValue(null);
    const result = await POST(req("request", { kind: "CORRECTION" }));
    expect(result.status).toBe(404);
    expect(JSON.stringify(await result.json())).not.toContain("internal-donation-id");
    expect(mocks.open).not.toHaveBeenCalled();
  });
  it("records a scoped review request, never deleting or modifying a donation", async () => {
    const result = await POST(req("request", { kind: "DELETION_REVIEW" }));
    expect(result.status).toBe(200);
    expect(mocks.open).toHaveBeenCalledWith("internal-donation-id", "DELETION_REVIEW");
    expect(await result.json()).toEqual({
      kind: "DELETION_REVIEW", status: "OPEN",
      requestedAt: "2026-10-15T05:00:00.000Z",
      message: "Request recorded for staff review. No donation record has been changed.",
    });
    expect(result.headers.get("cache-control")).toMatch(/no-store.*private/);
    expect(result.headers.get("x-robots-tag")).toContain("noindex");
  });
  it("returns only consent-safe request status for that receipt", async () => {
    mocks.read.mockResolvedValue([{ kind: "ACCESS", status: "IN_REVIEW", requestedAt: "2026-10-10T12:00:00.000Z" }]);
    const result = await POST(req("status"));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({ requests: [
      { kind: "ACCESS", status: "IN_REVIEW", requestedAt: "2026-10-10T12:00:00.000Z" },
    ] });
    expect(mocks.read).toHaveBeenCalledWith("internal-donation-id");
    expect(mocks.open).not.toHaveBeenCalled();
  });
});
