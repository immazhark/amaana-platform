import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initiativeFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    initiative: {
      findMany: mocks.initiativeFindMany,
    },
  },
}));

import {
  getCompletedAidShowcaseData,
  getImpactPageData,
  getProgrammeChildMedia,
} from "./public-page-data";
import { getPublishedInitiativeBySlug } from "./public-content";
import { getInitiativePageData } from "./public-page-data";

describe("public page gallery media query contracts", () => {
  beforeEach(() => {
    mocks.initiativeFindMany.mockReset();
    mocks.initiativeFindMany.mockResolvedValue([]);
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
