import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getHomepageAppeals: vi.fn() }));
vi.mock("@/lib/public-content", () => ({ getHomepageAppeals: mocks.getHomepageAppeals }));
import { GET } from "./route";

describe("live appeal rail cache boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("prevents downstream caches retaining a withdrawn promotional payload", async () => {
    mocks.getHomepageAppeals.mockResolvedValueOnce([{ slug: "reviewed", title: "Reviewed appeal", summary: "Public summary" }]).mockResolvedValueOnce([]);
    const initial = await GET();
    expect(initial.headers.get("Cache-Control")).toBe("no-store");
    expect((await initial.json()).items).toHaveLength(1);
    const withdrawn = await GET();
    expect(withdrawn.headers.get("Cache-Control")).toBe("no-store");
    expect(await withdrawn.json()).toEqual({ items: [] });
  });

  it("does not cache the fail-closed empty response", async () => {
    mocks.getHomepageAppeals.mockRejectedValue(new Error("unavailable"));
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ items: [] });
  });
});
