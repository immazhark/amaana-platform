import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isSameOrigin: vi.fn(),
  enforceAnalyticsRateLimit: vi.fn(),
  upsert: vi.fn(),
}));

vi.mock("@/lib/request-security", () => ({
  isSameOrigin: mocks.isSameOrigin,
  enforceAnalyticsRateLimit: mocks.enforceAnalyticsRateLimit,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { dailyWebVital: { upsert: mocks.upsert } },
}));

import { POST } from "./route";

function post(payload: unknown, origin = "https://amaanafoundation.org") {
  return new Request("https://amaanafoundation.org/api/analytics/web-vitals", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.enforceAnalyticsRateLimit.mockResolvedValue(true);
  mocks.upsert.mockResolvedValue({ id: "aggregate-1" });
});

describe("first-party Web Vitals reporting boundary", () => {
  it("increments anonymous daily buckets without storing individual event identifiers", async () => {
    const response = await POST(post({ path: "/about", name: "INP", value: 40 }));
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const query = mocks.upsert.mock.calls[0]?.[0];
    if (!query) throw new Error("Expected a persisted aggregate update");
    expect(query.where.path_date_metric).toMatchObject({ path: "/about", metric: "INP" });
    expect(query.create).toMatchObject({ path: "/about", metric: "INP", excellent: 1, good: 0, needsImprovement: 0, poor: 0 });
    expect(query.create).not.toHaveProperty("clientHash");
    expect(query.create).not.toHaveProperty("metricId");
    expect(query.update.excellent).toEqual({ increment: 1 });
  });

  it("rejects private paths, invalid names and query-string identifiers", async () => {
    for (const payload of [
      { path: "/admin", name: "INP", value: 30 },
      { path: "/about?token=secret", name: "LCP", value: 1200 },
      { path: "/about", name: "FID", value: 30 },
    ]) expect((await POST(post(payload))).status).toBe(204);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("rejects origins and rate-limited visitors before writing", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    await POST(post({ path: "/about", name: "LCP", value: 1000 }, "https://attacker.invalid"));
    expect(mocks.enforceAnalyticsRateLimit).not.toHaveBeenCalled();
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.enforceAnalyticsRateLimit.mockResolvedValue(false);
    await POST(post({ path: "/about", name: "LCP", value: 1000 }));
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("fails closed and quietly if storage is unavailable", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("synthetic database unavailable"));
    const response = await POST(post({ path: "/impact", name: "CLS", value: 0.07 }));
    expect(response.status).toBe(204);
    expect(await response.text()).toBe("");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex/);
  });
});
