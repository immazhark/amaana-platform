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
    const payload = await initial.json();
    expect(payload.items).toHaveLength(1);
    expect(payload.items[0]).not.toHaveProperty("subtitle");
    const withdrawn = await GET();
    expect(withdrawn.headers.get("Cache-Control")).toBe("no-store");
    expect(await withdrawn.json()).toEqual({ items: [] });
  });

  it("requests the complete four-item rail rather than the homepage's three-item default", async () => {
    mocks.getHomepageAppeals.mockResolvedValue(
      ["one", "two", "three", "four"].map(slug => ({ slug, title: `Reviewed ${slug}` })),
    );
    const response = await GET();
    expect(mocks.getHomepageAppeals).toHaveBeenCalledWith(4);
    const data = await response.json();
    expect(data.items).toHaveLength(4);
    expect(data.items.map((item: { id: string }) => item.id))
      .toEqual(["appeal-one", "appeal-two", "appeal-three", "appeal-four"]);
  });

  it("distinguishes an unavailable source from a confirmed empty result without caching it", async () => {
    mocks.getHomepageAppeals.mockRejectedValue(new Error("unavailable"));
    const response = await GET();
    expect(response.status).toBe(503);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.json()).toEqual({ items: [] });
  });
});
