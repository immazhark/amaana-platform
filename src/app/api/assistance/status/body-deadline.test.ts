import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), allowTracking: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { assistanceRequest: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/request-security", () => ({ isSameOrigin: () => true, enforceTrackingRateLimit: mocks.allowTracking }));
vi.mock("@/lib/assistance", () => ({ hashTrackingToken: () => "a".repeat(64) }));
import { POST } from "./route";

beforeEach(() => { vi.resetAllMocks(); mocks.allowTracking.mockResolvedValue(true); });
afterEach(() => vi.useRealTimers());

describe("private tracking ingress absolute body deadline", () => {
  it("responds within five seconds even when stream cancellation never settles", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const request = new Request("https://amaanafoundation.org/api/assistance/status", {
      method: "POST", body: new ReadableStream({ cancel }), duplex: "half",
    } as RequestInit & { duplex: "half" });

    let response: Response | undefined;
    void POST(request).then(value => { response = value; });
    await vi.advanceTimersByTimeAsync(4_999);
    expect(response).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);

    expect(response?.status).toBe(503);
    expect(await response?.json()).toEqual({ found: false });
    expect(response?.headers.get("retry-after")).toBe("60");
    expect(response?.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response?.headers.get("referrer-policy")).toBe("no-referrer");
    expect(cancel).toHaveBeenCalledOnce();
    expect(mocks.allowTracking).toHaveBeenCalledOnce();
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it("preserves existing unknown-reference behavior for a complete bounded JSON request", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const response = await POST(new Request("https://amaanafoundation.org/api/assistance/status", {
      method: "POST", body: JSON.stringify({ reference: "AFR-UNKNOWN", token: "synthetic-private-tracking-token" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ found: false });
    expect(mocks.allowTracking).toHaveBeenCalledTimes(1);
    expect(mocks.findUnique).toHaveBeenCalledTimes(1);
  });
});
