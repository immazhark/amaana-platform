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

import { getHomepageAppeals, getLiveRailAppeals } from "./public-content";

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

  it("fails closed on malformed top-level appeal query results without enabling checkout", async () => {
    mocks.findMany.mockResolvedValueOnce({ internal: "PRIVATE_APPEAL_DATA" });
    const visible = await getHomepageAppeals(20);
    expect(visible).toEqual([]);
    expect(JSON.stringify(visible)).not.toContain("PRIVATE_APPEAL_DATA");
  });

  it("does not disguise database failures as an empty eligible-appeal list", async () => {
    mocks.findMany.mockRejectedValueOnce(new Error("isolated database unavailable"));
    await expect(getHomepageAppeals(20)).rejects.toThrow("isolated database unavailable");
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

describe("site-wide live rail lean projection", () => {
  beforeEach(() => {
    mocks.findMany.mockReset().mockResolvedValue([]);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T11:00:00.000Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("uses the same SQL eligibility and order, with only the seven needed fields", async () => {
    mocks.findMany.mockResolvedValue([payableAppeal]);
    await getHomepageAppeals();
    await getLiveRailAppeals();
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
    const [home, rail] = mocks.findMany.mock.calls.map(([query]) => query);
    expect(rail.where).toEqual(home.where);
    expect(rail.orderBy).toEqual(home.orderBy);
    expect(rail.select).toEqual({
      slug: true, title: true, summary: true, status: true,
      goalAmount: true, amountRaised: true, closesAt: true,
    });
    expect(rail).not.toHaveProperty("take");
    expect(home.select).toMatchObject({ category: true, beneficiaryLocation: true, coverImageUrl: true });
  });

  it("keeps the first four payable public candidates after the final guard", async () => {
    mocks.findMany.mockResolvedValueOnce([
      { ...payableAppeal, slug: "STAGING-test" },
      { ...payableAppeal, slug: "expired", closesAt: new Date("2026-10-22T11:00:00.000Z") },
      { ...payableAppeal, slug: "closed", status: "CLOSED" },
      { ...payableAppeal, slug: "funded", amountRaised: "1000.00" },
      { ...payableAppeal, slug: "unpayable", amountRaised: "999.50" },
      ...Array.from({ length: 6 }, (_, index) => ({ ...payableAppeal, slug: "reviewed-" + index })),
    ]);
    expect((await getLiveRailAppeals()).map(appeal => appeal.slug)).toEqual(["reviewed-0", "reviewed-1", "reviewed-2", "reviewed-3"]);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it("reads again without caching and preserves malformed and failed result behavior", async () => {
    mocks.findMany.mockResolvedValueOnce({ internal: "synthetic-private" })
      .mockResolvedValueOnce([payableAppeal])
      .mockRejectedValueOnce(new Error("synthetic failure"));
    expect(await getLiveRailAppeals()).toEqual([]);
    expect((await getLiveRailAppeals()).map(appeal => appeal.slug)).toEqual(["reviewed-live"]);
    await expect(getLiveRailAppeals()).rejects.toThrow("synthetic failure");
    expect(mocks.findMany).toHaveBeenCalledTimes(3);
  });
});
