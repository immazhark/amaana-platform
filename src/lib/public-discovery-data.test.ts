import { beforeEach, expect, it, vi } from "vitest";
import { STORY_PAGE_SIZE } from "./story-discovery";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { story: { findMany: mocks.findMany } } }));

import { getStoriesDiscoveryIndexData, getVisibleStoryCards } from "./public-discovery-data";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

it("indexes only public story metadata without loading media for the full archive", async () => {
  await getStoriesDiscoveryIndexData();

  expect(mocks.findMany).toHaveBeenCalledOnce();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual({ status: "PUBLISHED", privacyApprovedAt: { not: null } });
  expect(query.orderBy).toEqual([{ isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" }]);
  expect(query.select).toMatchObject({ id: true, slug: true, title: true, summary: true, publishedAt: true });
  expect(query.select).not.toHaveProperty("mediaAssets");
});

it("loads identity-media candidates only for selected public page IDs", async () => {
  mocks.findMany.mockResolvedValue([{ id: "story-b" }, { id: "story-a" }]);
  const cards = await getVisibleStoryCards(["story-a", "story-b"]);

  expect(cards.map(card => card.id)).toEqual(["story-a", "story-b"]);
  expect(mocks.findMany).toHaveBeenCalledOnce();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual({
    status: "PUBLISHED",
    privacyApprovedAt: { not: null },
    id: { in: ["story-a", "story-b"] },
  });
  expect(query.select.mediaAssets).toMatchObject({
    where: { kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null }, publicUrl: { not: null }, altText: { not: "" } },
    take: 3,
  });
});

it("omits a story withdrawn between index selection and media loading", async () => {
  mocks.findMany.mockResolvedValue([{ id: "still-public" }]);
  const cards = await getVisibleStoryCards(["withdrawn", "still-public"]);

  expect(cards.map(card => card.id)).toEqual(["still-public"]);
  expect(mocks.findMany.mock.calls[0]?.[0].where).toMatchObject({
    status: "PUBLISHED", privacyApprovedAt: { not: null },
  });
});

it("skips detail queries for empty pages and rejects an unbounded caller", async () => {
  expect(await getVisibleStoryCards([])).toEqual([]);
  await expect(getVisibleStoryCards(Array.from({ length: STORY_PAGE_SIZE + 1 }, (_, i) => `story-${i}`)))
    .rejects.toThrow(/page size|at most/i);
  expect(mocks.findMany).not.toHaveBeenCalled();
});
