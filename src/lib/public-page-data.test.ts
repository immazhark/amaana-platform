import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initiativeFindMany: vi.fn(),
  appealFindMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    initiative: {
      findMany: mocks.initiativeFindMany,
    },
    appeal: { findMany: mocks.appealFindMany },
  },
}));

import {
  getCompletedAidShowcaseData,
  getProgrammeChildMedia,
  getAppealsIndexData,
} from "./public-page-data";

describe("public page gallery media query contracts", () => {
  beforeEach(() => {
    mocks.initiativeFindMany.mockReset();
    mocks.initiativeFindMany.mockResolvedValue([]);
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

describe("public appeal index promotion privacy", () => {
  it("excludes explicit HIGHLY_SENSITIVE case identities and strips verification context", async () => {
    const standard = {
      slug: "reviewed-standard", title: "Reviewed appeal", summary: "Public-safe summary",
      category: "MEDICAL", beneficiaryLocation: null, status: "PUBLISHED",
      goalAmount: 75000, amountRaised: 0, closesAt: null,
      assistanceRequest: { verification: { confidentialityLevel: "STANDARD" } },
    };
    const sensitive = {
      ...standard, slug: "restricted-private", title: "Identity must not appear",
      summary: "Private sensitive narrative",
      assistanceRequest: { verification: { confidentialityLevel: "HIGHLY_SENSITIVE" } },
    };
    mocks.appealFindMany.mockResolvedValue([sensitive, standard]);
    const appeals = await getAppealsIndexData();
    expect(appeals.map(appeal => appeal.slug)).toEqual(["reviewed-standard"]);
    expect(appeals[0]?.title).toBe("Reviewed appeal");
    expect(appeals[0]).not.toHaveProperty("assistanceRequest");
    expect(JSON.stringify(appeals)).not.toContain("Identity must not appear");
    expect(JSON.stringify(appeals)).not.toContain("confidentialityLevel");
    expect(mocks.appealFindMany).toHaveBeenCalledTimes(1);
    const query = mocks.appealFindMany.mock.calls[0]?.[0];
    expect(query?.select?.assistanceRequest?.select?.verification?.select).toEqual({
      confidentialityLevel: true,
    });
  });
});
