import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initiativeFindMany: vi.fn(),
  causeFindMany: vi.fn(),
  appealFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    initiative: {
      findMany: mocks.initiativeFindMany,
    },
    cause: { findMany: mocks.causeFindMany },
    appeal: { findMany: mocks.appealFindMany, fields: { goalAmount: 'appeal.goalAmount' } },
  },
}));

import {
  getAppealsIndexData,
  getCompletedAidShowcaseData,
  getImpactComparisonPageData,
  getImpactPageData,
  getHomepageDiscoveryData,
  getProgrammeChildMedia,
} from "./public-page-data";
import { getPublishedInitiativeBySlug } from "./public-content";
import { getInitiativePageData } from "./public-page-data";

describe("public page gallery media query contracts", () => {
  afterEach(() => vi.unstubAllEnvs());
  beforeEach(() => {
    mocks.initiativeFindMany.mockReset();
    mocks.initiativeFindMany.mockResolvedValue([]);
    mocks.causeFindMany.mockReset();
    mocks.causeFindMany.mockResolvedValue([]);
    mocks.appealFindMany.mockReset().mockResolvedValue([]);
  });

  it("uses one request-cached lookup identity for metadata, programmes and general pages", () => {
    // Independent wrapper functions cannot share React's request-local cache.
    expect(getInitiativePageData).toBe(getPublishedInitiativeBySlug);
  });

  it("projects at most eight published initiative outcomes with no financial or private records", async () => {
    mocks.initiativeFindMany.mockResolvedValueOnce([
      { slug: "eid-kits-2026", title: "Eid Kits", primaryMetric: "710", primaryMetricLabel: "kits distributed" },
      { slug: "unverified-metric", title: "Unverified metric", primaryMetric: " ", primaryMetricLabel: "kits" },
      { slug: "winter-relief", title: "Winter Relief", primaryMetric: "234", primaryMetricLabel: "kits" },
    ]);
    const { getDonationImpactHighlights } = await import("./public-page-data");
    const items = await getDonationImpactHighlights();
    expect(items).toHaveLength(2);
    expect(items.map(item => item.slug)).toEqual(["eid-kits-2026", "winter-relief"]);
    const query = mocks.initiativeFindMany.mock.calls.at(-1)?.[0];
    expect(query).toMatchObject({
      where: {
        status: "PUBLISHED", cause: { status: "PUBLISHED" },
        primaryMetric: { not: null }, primaryMetricLabel: { not: null },
      },
      take: 8,
      select: {
        slug: true, title: true, primaryMetric: true, primaryMetricLabel: true,
      },
    });
    expect(query.select).not.toHaveProperty("financialSummary");
    expect(query.select).not.toHaveProperty("assistanceRequest");
    expect(query.select).not.toHaveProperty("mediaAssets");
  });

  it("shows no donor proof on an empty reviewed metric projection", async () => {
    const { getDonationImpactHighlights } = await import("./public-page-data");
    await expect(getDonationImpactHighlights()).resolves.toEqual([]);
  });

  it("keeps homepage outcome metrics without loading unused initiative media and story fields", async () => {
    mocks.initiativeFindMany
      .mockResolvedValueOnce([
        { slug: "verified-2026", title: "Verified initiative", primaryMetric: "234", primaryMetricLabel: "winter kits" },
      ])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ slug: "verified-2026" }]);
    const data = await getHomepageDiscoveryData();
    expect(data.initiatives).toEqual([
      { slug: "verified-2026", title: "Verified initiative", primaryMetric: "234", primaryMetricLabel: "winter kits" },
    ]);
    expect(data.publishedProgrammeSlugs).toEqual(["verified-2026"]);
    expect(mocks.initiativeFindMany).toHaveBeenCalledTimes(3);
    expect(mocks.causeFindMany).toHaveBeenCalledOnce();

    for (const query of mocks.initiativeFindMany.mock.calls.slice(0, 2).map(call => call[0])) {
      expect(query.select).toEqual({
        slug: true, title: true, primaryMetric: true, primaryMetricLabel: true,
      });
      expect(query.where).toMatchObject({
        status: "PUBLISHED", cause: { status: "PUBLISHED" },
      });
      for (const unused of ["mediaAssets", "summary", "year", "endYear", "isFeatured", "cause", "id", "appeals"]) {
        expect(query.select).not.toHaveProperty(unused);
      }
    }
    expect(mocks.initiativeFindMany.mock.calls[0]?.[0].where)
      .toHaveProperty("mediaAssets.some");
  });

  it("restricts the public appeals index to unpaid, unexpired published candidates at SQL", async () => {
    const before = new Date();
    await getAppealsIndexData();
    const after = new Date();

    const query = mocks.appealFindMany.mock.calls[0]?.[0];
    expect(query?.where).toMatchObject({
      status: "PUBLISHED",
      amountRaised: { lt: "appeal.goalAmount" },
      OR: [{ closesAt: null }, { closesAt: { gt: expect.any(Date) } }],
    });
    const cutoff = query.where.OR[1].closesAt.gt as Date;
    expect(cutoff.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(cutoff.getTime()).toBeLessThanOrEqual(after.getTime());
    expect(query).toMatchObject({
      orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }],
      select: {
        slug: true,
        title: true,
        summary: true,
        category: true,
        beneficiaryLocation: true,
        status: true,
        goalAmount: true,
        amountRaised: true,
        closesAt: true,
      },
    });
    expect(query).not.toHaveProperty("take");
    expect(query.select).not.toHaveProperty("assistanceRequest");
    expect(query.select).not.toHaveProperty("story");
    expect(query.select).not.toHaveProperty("updates");
  });

  it("excludes staging-test appeals from the production SQL projection", async () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    await getAppealsIndexData();

    const where = mocks.appealFindMany.mock.calls[0]?.[0]?.where;
    expect(where.NOT).toEqual([
      { slug: { startsWith: "staging-" } },
      { title: { startsWith: "STAGING TEST" } },
    ]);
  });

  it("keeps staging-test appeal previews available in the staging SQL projection", async () => {
    vi.stubEnv("APP_ENVIRONMENT", "staging");
    await getAppealsIndexData();

    const where = mocks.appealFindMany.mock.calls[0]?.[0]?.where;
    expect(where.NOT).toBeUndefined();
  });

  it("does not retrieve unused image galleries on impact comparison", async () => {
    await getImpactComparisonPageData();

    const query = mocks.initiativeFindMany.mock.calls[0]?.[0];
    expect(query).toMatchObject({
      where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      select: {
        id: true, slug: true, title: true, summary: true,
        primaryMetric: true, primaryMetricLabel: true,
        cause: { select: { title: true } },
      },
    });
    expect(query.select).not.toHaveProperty("mediaAssets");
    expect(query.select).not.toHaveProperty("assistanceRequest");
    expect(query.select).not.toHaveProperty("financialSummary");
  });

  it("restricts impact images to identity-approved cover candidates before fetching records", async () => {
    await getImpactPageData();

    const query = mocks.initiativeFindMany.mock.calls[0]?.[0];
    expect(query).toMatchObject({
      where: { status: "PUBLISHED", cause: { status: "PUBLISHED" } },
      select: {
        mediaAssets: {
          where: {
            kind: "IMAGE",
            isPublic: true,
            privacyApprovedAt: { not: null },
            publicUrl: { not: null },
            altText: { not: "" },
            sortOrder: -1000,
          },
          take: 12,
          select: { id: true, publicUrl: true, altText: true, sortOrder: true },
        },
      },
    });
    // Audit: impact must not populate visual surfaces using gallery-only images.
    expect(query.select.mediaAssets.where).toHaveProperty("sortOrder", -1000);
    expect(query.select).not.toHaveProperty("financialSummary");
    expect(query.select).not.toHaveProperty("assistanceRequest");
  });

  it("uses bounded approved image sets for completed support and programme child cards", async () => {
    await getCompletedAidShowcaseData();
    await getProgrammeChildMedia(["eid-gift-kits-2025"]);

    expect(mocks.initiativeFindMany).toHaveBeenCalledTimes(2);

    const completedCall = mocks.initiativeFindMany.mock.calls[0];
    const childCall = mocks.initiativeFindMany.mock.calls[1];
    if (!completedCall || !childCall) throw new Error("Expected both initiative media queries.");
    const completedArgs = completedCall[0];
    const childArgs = childCall[0];

    for (const mediaQuery of [
      completedArgs.select.mediaAssets,
      childArgs.select.mediaAssets,
    ]) {
      expect(mediaQuery.take).toBe(12);
      expect(mediaQuery.where).toMatchObject({
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
        publicUrl: { not: null },
        altText: { not: "" },
      });
      expect(mediaQuery.where).not.toHaveProperty("sortOrder");
      expect(mediaQuery.orderBy).toEqual([
        { sortOrder: "asc" },
        { sourceYear: "desc" },
        { createdAt: "desc" },
      ]);
    }

    expect(completedArgs.where).toMatchObject({
      status: "PUBLISHED",
      cause: { slug: "medical-financial-relief", status: "PUBLISHED" },
    });
    expect(childArgs.where).toMatchObject({
      slug: { in: ["eid-gift-kits-2025"] },
      status: "PUBLISHED",
      cause: { status: "PUBLISHED" },
    });
  });
});
