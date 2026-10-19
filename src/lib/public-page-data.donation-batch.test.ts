import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  goalAmountRef: { _ref: "goalAmount" },
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findMany: mocks.findMany, fields: { goalAmount: mocks.goalAmountRef } } },
}));

import { getReviewedDonationPageData } from "./public-page-data";

const appeal = (slug: string, overrides: Record<string, unknown> = {}) => ({
  id: `test-${slug}`,
  slug,
  title: `Reviewed ${slug}`,
  summary: "Synthetic test record",
  beneficiaryLocation: null,
  category: "MEDICAL",
  status: "PUBLISHED",
  goalAmount: "1000.00",
  amountRaised: "0.00",
  closesAt: null,
  assistanceRequest: { verification: { zakatStatus: "ELIGIBLE" } },
  ...overrides,
});

describe("bounded reviewed donation query", () => {
  beforeEach(() => {
    mocks.findMany.mockReset().mockResolvedValue([]);
    vi.stubEnv("APP_ENVIRONMENT", "production");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("selects payable published appeals in one ordered, bounded database query", async () => {
    mocks.findMany.mockResolvedValueOnce([appeal("first"), appeal("second")]);
    const result = await getReviewedDonationPageData();
    expect(result.map(item => item.slug)).toEqual(["first", "second"]);
    expect(result[0]?.zakatEligible).toBe(true);
    expect(result[0]).not.toHaveProperty("assistanceRequest");
    expect(mocks.findMany).toHaveBeenCalledOnce();
    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args.take).toBe(12);
    expect(args.where).toMatchObject({
      status: "PUBLISHED",
      amountRaised: { lt: mocks.goalAmountRef },
      OR: [{ closesAt: null }, { closesAt: { gt: expect.any(Date) } }],
      NOT: [
        { slug: { startsWith: "staging-" } },
        { title: { startsWith: "STAGING TEST" } },
      ],
    });
    expect(args.orderBy).toEqual([
      { isFeatured: "desc" },
      { featuredOrder: "asc" },
      { publishedAt: "desc" },
      { id: "asc" },
    ]);
    expect(args.select).toMatchObject({
      id: true, slug: true, title: true, goalAmount: true, amountRaised: true,
      closesAt: true,
      assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } },
    });
    expect(args.select).not.toHaveProperty("donations");
    expect(args.select).not.toHaveProperty("beneficiaryName");
    expect(args.select).not.toHaveProperty("story");
  });

  it("defends against stale, expired and synthetic results even if a query returns them", async () => {
    mocks.findMany.mockResolvedValueOnce([
      appeal("live", { assistanceRequest: null }),
      appeal("funded", { amountRaised: "1000.00" }),
      appeal("expired", { closesAt: new Date("2020-01-01T00:00:00Z") }),
      appeal("staging-synthetic", { title: "STAGING TEST - fixture" }),
    ]);
    const result = await getReviewedDonationPageData();
    expect(result.map(item => item.slug)).toEqual(["live"]);
    expect(result[0]?.zakatEligible).toBe(false);
  });

  it("excludes closed listings in SQL so later payable appeals are not displaced", async () => {
    mocks.findMany.mockResolvedValueOnce([appeal("live-5")]);
    const result = await getReviewedDonationPageData();
    expect(result.map(item => item.slug)).toEqual(["live-5"]);
    const query = mocks.findMany.mock.calls[0]?.[0];
    expect(query.where.amountRaised.lt).toEqual(mocks.goalAmountRef);
    expect(query.where.OR).toEqual([
      { closesAt: null },
      { closesAt: { gt: expect.any(Date) } },
    ]);
  });

  it("continues past fractional last balances without reading the entire listing", async () => {
    const unpaid = Array.from({ length: 12 }, (_, i) =>
      appeal(`fractional-${i}`, { amountRaised: "999.99" }));
    mocks.findMany.mockResolvedValueOnce(unpaid).mockResolvedValueOnce([appeal("payable-next")]);

    const result = await getReviewedDonationPageData();
    expect(result.map(item => item.slug)).toEqual(["payable-next"]);
    expect(mocks.findMany).toHaveBeenCalledTimes(2);
    const continuation = mocks.findMany.mock.calls[1]?.[0];
    expect(continuation.take).toBe(12);
    expect(continuation.skip).toBe(1);
    expect(continuation.cursor).toEqual({ id: "test-fractional-11" });
  });

  it("caps fractional-balance scans at four bounded database reads", async () => {
    mocks.findMany.mockResolvedValue(Array.from({ length: 12 }, (_, i) =>
      appeal(`fractional-${i}`, { amountRaised: "999.99" })));
    await expect(getReviewedDonationPageData()).resolves.toEqual([]);
    expect(mocks.findMany).toHaveBeenCalledTimes(4);
  });

  it("permits staging-only appeals only in staging", async () => {
    vi.stubEnv("APP_ENVIRONMENT", "staging");
    mocks.findMany.mockResolvedValueOnce([appeal("staging-test")]);
    expect((await getReviewedDonationPageData()).map(item => item.slug)).toEqual(["staging-test"]);
    expect(mocks.findMany.mock.calls[0]?.[0].where.NOT).toBeUndefined();
  });

  it("returns an empty list for no payable appeals", async () => {
    await expect(getReviewedDonationPageData()).resolves.toEqual([]);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it("propagates database failures instead of falsely claiming all appeals are closed", async () => {
    mocks.findMany.mockRejectedValueOnce(new Error("Unavailable database"));
    await expect(getReviewedDonationPageData()).rejects.toThrow("Unavailable database");
  });
});
