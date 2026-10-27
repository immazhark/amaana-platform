import { beforeEach, expect, it, vi } from "vitest";
import { publicFaithWhere } from "./faith-publication";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: { findMany: mocks.findMany } } }));
import { getFaithDiscoveryData, getVisibleFaithMedia } from "./public-discovery-data";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

it("loads reviewed library metadata without media relations for the entire archive", async () => {
  await getFaithDiscoveryData();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual(publicFaithWhere);
  expect(query.orderBy).toEqual([{ isFeatured: "desc" }, { publishedAt: "desc" }]);
  expect(query.select).toMatchObject({ id: true, title: true, excerpt: true, topics: { select: { topic: { select: { slug: true, name: true } } } } });
  expect(query.select).not.toHaveProperty("mediaAssets");
});

it("bounds media work to the two distinct visible records and repeats review and image predicates", async () => {
  await getVisibleFaithMedia(["hero", "lead", "hero"]);
  expect(mocks.findMany).toHaveBeenCalledOnce();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual({ ...publicFaithWhere, id: { in: ["hero", "lead"] } });
  expect(Object.keys(query.select).sort()).toEqual(["id", "mediaAssets"]);
  expect(query.select.mediaAssets).toMatchObject({
    where: { kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null }, publicUrl: { not: null }, altText: { not: "" } },
    orderBy: { sortOrder: "asc" }, take: 3,
  });
});

it("skips an empty library and rejects more than two unique visible IDs before querying", async () => {
  expect(await getVisibleFaithMedia([])).toEqual([]);
  await expect(getVisibleFaithMedia(["a", "b", "c"])).rejects.toThrow(/at most two/i);
  expect(mocks.findMany).not.toHaveBeenCalled();
});

it("does not replace a withdrawn visible record with another library image", async () => {
  mocks.findMany.mockResolvedValue([{ id: "lead", mediaAssets: [] }]);
  expect(await getVisibleFaithMedia(["withdrawn-hero", "lead"])).toEqual([{ id: "lead", mediaAssets: [] }]);
  expect(mocks.findMany.mock.calls[0]?.[0].where).toEqual({ ...publicFaithWhere, id: { in: ["withdrawn-hero", "lead"] } });
});
