import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ faith: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { faithContent: { findMany: mocks.faith } },
}));
import { getFaithDiscoveryData } from "./public-discovery-data";
import { publicFaithWhere } from "./faith-publication";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.faith.mockResolvedValue([]);
});

it("orders tied reviewed Faith records by unique ID without broadening eligibility", async () => {
  await getFaithDiscoveryData();
  const query = mocks.faith.mock.calls[0]?.[0];
  expect(query.where).toEqual(publicFaithWhere);
  expect(query.orderBy).toEqual([
    { isFeatured: "desc" },
    { publishedAt: "desc" },
    { id: "asc" },
  ]);
  expect(query.select).toMatchObject({
    id: true, slug: true, title: true, excerpt: true,
    sourceCitation: true, verifiedAt: true,
  });
  expect(query.select).not.toHaveProperty("assistanceRequest");
});
