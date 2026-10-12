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
  prisma: { dailyPageView: { upsert: mocks.upsert } },
}));

import { POST } from "./route";

function pageViewRequest(path: string, origin = "https://amaanafoundation.org") {
  return new Request("https://amaanafoundation.org/api/analytics/page-view", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify({ path }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.enforceAnalyticsRateLimit.mockResolvedValue(true);
  mocks.upsert.mockResolvedValue({ id: "daily-view-1" });
});

describe("anonymous page-view persistence boundary", () => {
  it("persists only grouped public family keys, never identifying detail slugs", async () => {
    for (const [raw, grouped] of [
      ["/appeals/beneficiary-name-treatment", "/appeals/:slug"],
      ["/stories/patient-recovery", "/stories/:slug"],
      ["/our-work/eid-gift-kits-2026", "/our-work/:slug"],
    ] as const) {
      mocks.upsert.mockClear();
      const response = await POST(pageViewRequest(raw));
      expect(response.status).toBe(204);
      expect(mocks.upsert).toHaveBeenCalledTimes(1);
      const payload = mocks.upsert.mock.calls[0]?.[0];
      if (!payload) throw new Error("Expected page-view aggregate update");
      expect(payload.where.path_date.path).toBe(grouped);
      expect(payload.create.path).toBe(grouped);
      expect(payload.update.views).toEqual({ increment: 1 });
      expect(JSON.stringify(payload)).not.toContain(raw);
    }
  });

  it("cannot write private paths, cross-origin requests, or rate-limited visits", async () => {
    await POST(pageViewRequest("/request-assistance/status"));
    await POST(pageViewRequest("/admin"));
    await POST(pageViewRequest("/appeals/name?token=secret"));
    mocks.isSameOrigin.mockReturnValue(false);
    await POST(pageViewRequest("/about", "https://attacker.invalid"));
    mocks.isSameOrigin.mockReturnValue(true);
    mocks.enforceAnalyticsRateLimit.mockResolvedValue(false);
    await POST(pageViewRequest("/about"));
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("fails quietly with 204 when the database is unavailable", async () => {
    mocks.upsert.mockRejectedValueOnce(new Error("synthetic store failure"));
    const response = await POST(pageViewRequest("/about"));
    expect(response.status).toBe(204);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(await response.text()).toBe("");
  });
});
