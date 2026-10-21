import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getAppeals: vi.fn() }));
vi.mock("@/lib/public-content", () => ({
  getHomepageAppeals: mocks.getAppeals,
}));

import { GET } from "./route";

beforeEach(() => vi.resetAllMocks());

it("does not let CDN caching promote an appeal beyond its eligibility window", async () => {
  mocks.getAppeals.mockResolvedValue([{
    slug: "reviewed",
    title: "Reviewed appeal",
    summary: "Confirmed need",
  }]);
  const response = await GET();

  expect(response.headers.get("Cache-Control")).toMatch(/no-store/i);
  expect(response.headers.get("Cache-Control")).not.toMatch(/stale-while-revalidate|max-age=60/i);
  expect(await response.json()).toMatchObject({
    items: [{ detailsHref: "/appeals/reviewed", supportHref: "/donate/reviewed" }],
  });
});

it("does not cache an empty fallback caused by a temporary retrieval error", async () => {
  mocks.getAppeals.mockRejectedValue(new Error("Temporary database error"));
  const response = await GET();

  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toMatch(/no-store/i);
  expect(await response.json()).toEqual({ items: [] });
});
