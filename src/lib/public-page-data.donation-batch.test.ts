import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findMany: mocks.findMany } },
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

  it("uses exactly one publication-gated query and preserves display priority", async () => {
    mocks.findMany.mockResolvedValueOnce([appeal("second"), appeal("first")]);
    const result = await getReviewedDonationPageData(["first", "second"]);
    expect(result.map(item => item.slug)).toEqual(["first", "second"]);
    expect(result[0]?.zakatEligible).toBe(true);
    expect(result[0]).not.toHaveProperty("assistanceRequest");
    expect(mocks.findMany).toHaveBeenCalledOnce();
    const args = mocks.findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({ slug: { in: ["first", "second"] }, status: "PUBLISHED" });
    expect(args.select).toMatchObject({
      id: true, slug: true, title: true, goalAmount: true, amountRaised: true,
      closesAt: true,
      assistanceRequest: { select: { verification: { select: { zakatStatus: true } } } },
    });
    expect(args.select).not.toHaveProperty("donations");
    expect(args.select).not.toHaveProperty("beneficiaryName");
    expect(args.select).not.toHaveProperty("story");
  });

  it("excludes fully funded, expired and synthetic staging records in production", async () => {
    mocks.findMany.mockResolvedValueOnce([
      appeal("payable", { assistanceRequest: null }),
      appeal("funded", { amountRaised: "1000.00" }),
      appeal("expired", { closesAt: new Date("2020-01-01T00:00:00Z") }),
      appeal("staging-synthetic", { title: "STAGING TEST - fixture" }),
    ]);
    const result = await getReviewedDonationPageData(["payable", "funded", "expired", "staging-synthetic"]);
    expect(result.map(item => item.slug)).toEqual(["payable"]);
    expect(result[0]?.zakatEligible).toBe(false);
  });

  it("finds payable appeals after earlier funded or expired candidates", async () => {
    mocks.findMany.mockResolvedValueOnce([
      appeal("stale-1", { amountRaised: "1000.00" }),
      appeal("stale-2", { amountRaised: "1000.00" }),
      appeal("stale-3", { closesAt: new Date("2020-01-01T00:00:00Z") }),
      appeal("stale-4", { amountRaised: "1000.00" }),
      appeal("live-5"),
    ]);
    const selected = await getReviewedDonationPageData([
      "stale-1", "stale-2", "stale-3", "stale-4", "live-5",
    ]);
    expect(selected.map(item => item.slug)).toEqual(["live-5"]);
    expect(mocks.findMany).toHaveBeenCalledOnce();
  });

  it("deduplicates input and never retrieves more than twelve candidates", async () => {
    const input = ["first", "first", ...Array.from({ length: 20 }, (_, i) => `slug-${i}`)];
    await getReviewedDonationPageData(input);
    const slugs = mocks.findMany.mock.calls[0]?.[0].where.slug.in;
    expect(slugs).toHaveLength(12);
    expect(slugs.slice(0, 2)).toEqual(["first", "slug-0"]);
  });

  it("skips database traffic for an empty candidate list", async () => {
    await expect(getReviewedDonationPageData([])).resolves.toEqual([]);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("propagates database failures instead of falsely claiming all appeals are closed", async () => {
    mocks.findMany.mockRejectedValueOnce(new Error("Unavailable database"));
    await expect(getReviewedDonationPageData(["payable"])).rejects.toThrow("Unavailable database");
  });
});
