import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), allowReceipt: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { donation: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceAcknowledgementRateLimit: mocks.allowReceipt }));
vi.mock("@/lib/donations", () => ({ hashReceiptToken: () => "a".repeat(64), getDonationAcknowledgementPresentation: vi.fn() }));
import { POST } from "./route";

beforeEach(() => { vi.resetAllMocks(); mocks.allowReceipt.mockResolvedValue(true); });
afterEach(() => vi.useRealTimers());

describe("receipt body deadline before private access", () => {
  it("returns private503 at five seconds without quota or donor access even if cancellation stalls", async () => {
    vi.useFakeTimers();
    const request = new Request("https://amaanafoundation.org/api/donations/acknowledgement", {
      method: "POST", body: new ReadableStream({ cancel: () => new Promise<void>(() => {}) }), duplex: "half",
    } as RequestInit & { duplex: "half" });
    let response: Response | undefined;
    void POST(request).then(result => { response = result; });
    await vi.advanceTimersByTimeAsync(4999);
    expect(response).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ found: false });
    expect(response?.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response?.headers.get("x-robots-tag")).toMatch(/noindex/i);
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(mocks.allowReceipt).not.toHaveBeenCalled();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("retains normal unknown-reference behavior for a complete bounded request", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const response = await POST(new Request("https://amaanafoundation.org/api/donations/acknowledgement", {
      method: "POST", body: JSON.stringify({ reference: "AF-SYNTHETIC-UNKNOWN", token: "synthetic-token-at-least-twenty-characters" }),
    }));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.allowReceipt).toHaveBeenCalledTimes(1);
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });
});
