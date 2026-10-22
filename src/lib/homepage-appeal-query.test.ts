import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  goalAmountRef: { _ref: "appeal.goalAmount" },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appeal: {
      findMany: mocks.findMany,
      fields: { goalAmount: mocks.goalAmountRef },
    },
  },
}));

// The SQL contract is tested independently of Next's TTL storage.
vi.mock("next/cache", () => ({ unstable_cache: (read: unknown) => read }));

import { getHomepageAppeals } from "./public-content";

const payableAppeal = {
  slug: "reviewed-live",
  title: "Reviewed live need",
  summary: "Approved public description",
  category: "MEDICAL",
  beneficiaryLocation: null,
  coverImageUrl: null,
  status: "PUBLISHED",
  goalAmount: "1000.00",
  amountRaised: "100.00",
  closesAt: null,
};

describe("homepage appeal SQL projection", () => {
  beforeEach(() => {
    mocks.findMany.mockReset().mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T11:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("excludes funded, closed and synthetic candidates at SQL without hiding later payable appeals", async () => {
    mocks.findMany.mockResolvedValueOnce([payableAppeal]);
    const appeals = await getHomepageAppeals(20);
    expect(appeals.map(appeal => appeal.slug)).toEqual(["reviewed-live"]);

    const query = mocks.findMany.mock.calls[0]?.[0];
    expect(query.where).toMatchObject({
      status: "PUBLISHED",
      amountRaised: { lt: mocks.goalAmountRef },
      OR: [{ closesAt: null }, { closesAt: { gt: new Date("2026-10-22T11:00:00.000Z") } }],
      NOT: [
        { slug: { startsWith: "staging-" } },
        { title: { startsWith: "STAGING TEST" } },
      ],
    });
    expect(query.orderBy).toEqual([
      { isFeatured: "desc" },
      { featuredOrder: "asc" },
      { publishedAt: "desc" },
    ]);
    expect(query).not.toHaveProperty("take");
    expect(query.select).toMatchObject({
      slug: true, title: true, summary: true, category: true,
      beneficiaryLocation: true, coverImageUrl: true, status: true,
      goalAmount: true, amountRaised: true, closesAt: true,
    });
    expect(query.select).not.toHaveProperty("assistanceRequest");
    expect(query.select).not.toHaveProperty("story");
  });

  it("retains final public visibility and payable checks even if a query returns stale rows", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { ...payableAppeal, slug: "staging-fixture" },
      { ...payableAppeal, title: "STAGING TEST - fixture" },
      { ...payableAppeal, slug: "expired", closesAt: new Date("2020-01-01T00:00:00.000Z") },
      { ...payableAppeal, slug: "fully-funded", amountRaised: "1000.00" },
      payableAppeal,
    ]);
    expect((await getHomepageAppeals(20)).map(x => x.slug)).toEqual(["reviewed-live"]);
  });

  it("keeps the published order and limit after the final eligibility check", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { ...payableAppeal, slug: "expired", closesAt: new Date("2020-01-01T00:00:00.000Z") },
      { ...payableAppeal, slug: "first" },
      { ...payableAppeal, slug: "second" },
    ]);
    expect((await getHomepageAppeals(1)).map(x => x.slug)).toEqual(["first"]);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });
});
