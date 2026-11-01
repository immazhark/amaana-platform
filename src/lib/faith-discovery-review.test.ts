import { beforeEach, expect, it, vi } from "vitest";
import { publicFaithWhere } from "./faith-publication";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { faithContent: { findMany: mocks.findMany } },
}));
import { getFaithDiscoveryData } from "./public-discovery-data";

const approved = {
  id: "approved", slug: "reviewed", type: "ARTICLE", title: "Reviewed title",
  excerpt: "Reviewed summary", sourceCitation: "Reviewed reference",
  verifiedAt: new Date("2026-01-01T00:00:00Z"),
  status: "PUBLISHED", religiousReviewStatus: "VERIFIED",
  topics: [], mediaAssets: [],
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findMany.mockResolvedValue([]);
});

it("excludes blank, invalid, and unreviewed citations before Faith discovery cards", async () => {
  mocks.findMany.mockResolvedValue([
    approved,
    { ...approved, id: "blank", sourceCitation: "   " },
    { ...approved, id: "empty", sourceCitation: "" },
    { ...approved, id: "null", sourceCitation: null },
    { ...approved, id: "pending", religiousReviewStatus: "PENDING" },
    { ...approved, id: "unverified", verifiedAt: null },
  ]);
  const result = await getFaithDiscoveryData();
  expect(result.map(record => record.id)).toEqual(["approved"]);
  expect(result[0]).toEqual({
    id: approved.id, slug: approved.slug, type: approved.type,
    title: approved.title, excerpt: approved.excerpt,
    sourceCitation: approved.sourceCitation, verifiedAt: approved.verifiedAt,
    topics: [], mediaAssets: [],
  });
});

it("retains the SQL publication gate and unique ordering without serializing review status", async () => {
  mocks.findMany.mockResolvedValue([approved]);
  const result = await getFaithDiscoveryData();
  const query = mocks.findMany.mock.calls[0]?.[0];
  expect(query.where).toEqual(publicFaithWhere);
  expect(query.orderBy).toEqual([
    { isFeatured: "desc" }, { publishedAt: "desc" }, { id: "asc" },
  ]);
  expect(query.select).toMatchObject({
    id: true, slug: true, sourceCitation: true, verifiedAt: true,
    status: true, religiousReviewStatus: true,
  });
  expect(result[0]).not.toHaveProperty("status");
  expect(result[0]).not.toHaveProperty("religiousReviewStatus");
  expect(query.select).not.toHaveProperty("assistanceRequest");
});
