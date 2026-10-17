import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findAppeals: vi.fn() }));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: { appeal: { findMany: mocks.findAppeals } },
}));

import { getHomepageAppeals } from "./public-content";

describe("homepage appeal media disclosure boundary", () => {
  const appeal = {
    slug: "reviewed-support",
    title: "Reviewed need",
    summary: "Verified public summary",
    status: "PUBLISHED",
    goalAmount: 1000,
    amountRaised: 0,
    closesAt: null,
    coverImageUrl: "/media/reviewed-cover.jpg",
    assistanceRequest: {
      verification: {
        confidentialityLevel: "STANDARD",
        photoConsent: "ALLOWED",
      },
    },
  };

  beforeEach(() => {
    mocks.findAppeals.mockReset();
  });

  it.each(["NOT_ALLOWED", "UNCONFIRMED", null, "UNKNOWN"])(
    "withholds a linked cover from homepage data if photo consent is %s", async photoConsent => {
      mocks.findAppeals.mockResolvedValue([
        {
          ...appeal,
          assistanceRequest: {
            verification: { confidentialityLevel: "STANDARD", photoConsent },
          },
        },
      ]);
      const rows = await getHomepageAppeals(3);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.coverImageUrl).toBeNull();
      expect(rows[0]).not.toHaveProperty("assistanceRequest");
      expect(JSON.stringify(rows)).not.toContain("/media/reviewed-cover.jpg");
      expect(mocks.findAppeals.mock.calls[0]?.[0]?.select?.assistanceRequest?.select?.verification?.select)
        .toMatchObject({ confidentialityLevel: true, photoConsent: true });
    },
  );

  it.each(["ALLOWED", "NOT_APPLICABLE"])(
    "retains approved homepage imagery for %s photo review", async photoConsent => {
      mocks.findAppeals.mockResolvedValue([
        { ...appeal, assistanceRequest: { verification: { confidentialityLevel: "STANDARD", photoConsent } } },
      ]);
      const rows = await getHomepageAppeals();
      expect(rows[0]?.coverImageUrl).toBe("/media/reviewed-cover.jpg");
      expect(rows[0]).not.toHaveProperty("assistanceRequest");
    },
  );

  it("preserves legacy standalone promotional imagery", async () => {
    mocks.findAppeals.mockResolvedValue([{ ...appeal, assistanceRequest: null }]);
    const rows = await getHomepageAppeals();
    expect(rows[0]?.coverImageUrl).toBe("/media/reviewed-cover.jpg");
  });

  it("continues to exclude explicitly highly sensitive linked appeals", async () => {
    mocks.findAppeals.mockResolvedValue([
      {
        ...appeal,
        assistanceRequest: {
          verification: { confidentialityLevel: "HIGHLY_SENSITIVE", photoConsent: "ALLOWED" },
        },
      },
    ]);
    const rows = await getHomepageAppeals();
    expect(rows).toEqual([]);
  });
});
