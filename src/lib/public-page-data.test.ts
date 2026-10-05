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
  getProgrammeChildMedia,
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

    const completedArgs = mocks.initiativeFindMany.mock.calls[0][0];
    const childArgs = mocks.initiativeFindMany.mock.calls[1][0];

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
