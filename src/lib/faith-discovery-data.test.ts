import { beforeEach, expect, it, vi } from "vitest";
import { publicFaithWhere } from "./faith-publication";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: { findMany: mocks.findMany } } }));
import { getFaithDiscoveryData, getVisibleFaithMedia } from "./public-discovery-data";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

it("loads a stably ordered public Faith index without unneeded media relations", async () => {
  await getFaithDiscoveryData();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual(publicFaithWhere);
  expect(query.orderBy).toEqual([
    { isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" },
  ]);
  expect(query.select).toMatchObject({
    id: true, slug: true, title: true, excerpt: true,
    status: true, religiousReviewStatus: true, sourceCitation: true,
    topics: { select: { topic: { select: { slug: true, name: true } } } },
  });
  expect(query.select).not.toHaveProperty("mediaAssets");
});

it("omits review-only fields and incomplete citations from public Faith counts", async () => {
  const reviewed = {
    id: "approved", slug: "approved", type: "ARTICLE", title: "Reviewed",
    excerpt: "Reviewed excerpt", topics: [], verifiedAt: new Date("2026-01-01"),
    status: "PUBLISHED", religiousReviewStatus: "VERIFIED", sourceCitation: "Reviewed source",
  };
  mocks.findMany.mockResolvedValue([
    reviewed,
    { ...reviewed, id: "blank", sourceCitation: "  " },
    { ...reviewed, id: "null", sourceCitation: null },
    { ...reviewed, id: "pending", religiousReviewStatus: "PENDING" },
  ]);
  expect(await getFaithDiscoveryData()).toEqual([{
    id: "approved", slug: "approved", type: "ARTICLE", title: "Reviewed",
    excerpt: "Reviewed excerpt", topics: [], verifiedAt: reviewed.verifiedAt,
    sourceCitation: "Reviewed source",
  }]);
});

it("loads image candidates only for two distinct visible Faith IDs", async () => {
  await getVisibleFaithMedia(["hero", "lead", "hero"]);
  expect(mocks.findMany).toHaveBeenCalledOnce();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual({ ...publicFaithWhere, id: { in: ["hero", "lead"] } });
  expect(query.select).toMatchObject({
    id: true, status: true, religiousReviewStatus: true, verifiedAt: true, sourceCitation: true,
    mediaAssets: {
      where: {
        kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null },
        publicUrl: { not: null }, altText: { not: "" },
      },
      orderBy: { sortOrder: "asc" },
      take: 3,
    },
  });
});

it("rejects an unbounded media request and skips the database for no visible IDs", async () => {
  expect(await getVisibleFaithMedia([])).toEqual([]);
  await expect(getVisibleFaithMedia(["a", "b", "c"])).rejects.toThrow(/two/i);
  expect(mocks.findMany).not.toHaveBeenCalled();
});

it("fails closed for a withdrawn or incompletely reviewed visible Faith image", async () => {
  const approved = {
    id: "lead", mediaAssets: [], status: "PUBLISHED",
    religiousReviewStatus: "VERIFIED", verifiedAt: new Date("2026-01-01"),
    sourceCitation: "Reviewed source",
  };
  mocks.findMany.mockResolvedValue([
    { ...approved, id: "withdrawn", sourceCitation: "  " },
    approved,
    { ...approved, id: "pending", religiousReviewStatus: "PENDING" },
  ]);
  expect(await getVisibleFaithMedia(["withdrawn", "lead"])).toEqual([
    { id: "lead", mediaAssets: [] },
  ]);
  expect(mocks.findMany.mock.calls[0]?.[0].where).toMatchObject({
    ...publicFaithWhere, id: { in: ["withdrawn", "lead"] },
  });
});

it("fails closed for malformed second-read Faith media without weakening religious verification", async () => {
  const approved = {
    id: "hero", mediaAssets: [], status: "PUBLISHED",
    religiousReviewStatus: "VERIFIED", verifiedAt: new Date("2026-01-01"),
    sourceCitation: "Reviewed source",
  };
  mocks.findMany.mockResolvedValue([
    null, undefined,
    { ...approved, id: { internal: "PRIVATE_ID" } },
    { ...approved, mediaAssets: { internal: "PRIVATE_MEDIA" } },
    { ...approved, sourceCitation: { internal: "PRIVATE_CITATION" } },
    { ...approved, religiousReviewStatus: "PENDING" },
    approved,
  ]);
  const visible = await getVisibleFaithMedia(["hero"]);
  expect(visible).toEqual([{ id: "hero", mediaAssets: [] }]);
  expect(JSON.stringify(visible)).not.toContain("PRIVATE_");
  expect(mocks.findMany.mock.calls[0]?.[0].where).toEqual({
    ...publicFaithWhere, id: { in: ["hero"] },
  });
});

it("keeps only requested visible IDs even if the database responds with extra records", async () => {
  const reviewed = {
    id: "unrequested", mediaAssets: [], status: "PUBLISHED",
    religiousReviewStatus: "VERIFIED", verifiedAt: new Date("2026-01-01"),
    sourceCitation: "Reviewed source",
  };
  mocks.findMany.mockResolvedValue([reviewed]);
  expect(await getVisibleFaithMedia(["hero"])).toEqual([]);
});
