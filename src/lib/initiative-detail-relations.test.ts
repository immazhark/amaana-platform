import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findInitiative: vi.fn(), findStory: vi.fn(), findFaith: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { initiative: { findFirst: mocks.findInitiative }, story: { findFirst: mocks.findStory }, faithContent: { findFirst: mocks.findFaith } },
}));
vi.mock("next/cache", () => ({
  unstable_cache: (read: unknown) => read,
}));

import { getPublishedInitiativeBySlug, getPublishedStoryBySlug, getPublishedFaithContentBySlug, PUBLIC_DETAIL_MEDIA_LIMIT } from "./public-content";

describe("published initiative detail relation boundary", () => {
  beforeEach(() => {
    mocks.findInitiative.mockReset().mockResolvedValue(null);
    mocks.findStory.mockReset().mockResolvedValue(null);
    mocks.findFaith.mockReset().mockResolvedValue(null);
  });

  it("limits related records to only the public fields the detail page renders", async () => {
    await expect(getPublishedInitiativeBySlug("taleem")).resolves.toBeNull();
    expect(mocks.findInitiative).toHaveBeenCalledOnce();
    const query = mocks.findInitiative.mock.calls[0]?.[0];

    expect(query.where).toEqual({
      slug: "taleem", status: "PUBLISHED", cause: { status: "PUBLISHED" },
    });

    expect(query.include.cause).toEqual({ select: { title: true } });

    expect(query.include.stories).toEqual({
      where: { status: "PUBLISHED", privacyApprovedAt: { not: null } },
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, summary: true },
    });

    expect(query.include.appeals).toEqual({
      where: { status: { in: ["PUBLISHED", "FUNDED"] } },
      orderBy: { publishedAt: "desc" },
      select: {
        id: true, slug: true, title: true, status: true,
        goalAmount: true, amountRaised: true, closesAt: true,
      },
    });

    expect(query.include.faithContent).toMatchObject({
      orderBy: { publishedAt: "desc" },
      select: { id: true, slug: true, title: true, excerpt: true },
    });

    for (const relation of ["stories", "appeals", "faithContent"]) {
      const select = query.include[relation].select;
      expect(select).not.toHaveProperty("beneficiaryName");
      expect(select).not.toHaveProperty("beneficiaryEmail");
      expect(select).not.toHaveProperty("contactDetails");
      expect(select).not.toHaveProperty("story");
      expect(select).not.toHaveProperty("verification");
      expect(query.include[relation]).not.toHaveProperty("include");
    }
    expect(query.include.mediaAssets).toMatchObject({
      take: PUBLIC_DETAIL_MEDIA_LIMIT,
      select: { id: true, publicUrl: true, altText: true, sortOrder: true },
    });
  });

  it("selects only public linkage for published reviewed story pages", async () => {
    await expect(getPublishedStoryBySlug("reviewed-story")).resolves.toBeNull();
    const query = mocks.findStory.mock.calls[0]?.[0];
    expect(query.where).toEqual({
      slug: "reviewed-story", status: "PUBLISHED", privacyApprovedAt: { not: null },
    });
    expect(query.include.cause).toEqual({ select: { title: true, status: true } });
    expect(query.include.initiative).toEqual({
      select: {
        slug: true, title: true, status: true,
        cause: { select: { status: true } },
      },
    });
    expect(query.include.mediaAssets).toMatchObject({
      take: PUBLIC_DETAIL_MEDIA_LIMIT, select: { altText: true, publicUrl: true },
    });
  });

  it("limits published faith detail linkage without affecting topic or image review", async () => {
    await expect(getPublishedFaithContentBySlug("reviewed-reflection")).resolves.toBeNull();
    const query = mocks.findFaith.mock.calls[0]?.[0];
    expect(query.where).toMatchObject({ slug: "reviewed-reflection", status: "PUBLISHED" });
    expect(query.include.cause).toEqual({ select: { title: true, status: true } });
    expect(query.include.initiative).toEqual({
      select: {
        slug: true, title: true, status: true,
        cause: { select: { status: true } },
      },
    });
    expect(query.include.topics).toEqual({ include: { topic: true } });
    expect(query.include.mediaAssets).toMatchObject({
      take: PUBLIC_DETAIL_MEDIA_LIMIT, select: { id: true, publicUrl: true, altText: true },
    });
    for (const link of ["cause", "initiative"]) {
      expect(query.include[link]).not.toBe(true);
      expect(query.include[link]).not.toHaveProperty("include");
    }
  });

  it("retains the original published query and does not swallow database failures", async () => {
    const databaseError = new Error("database unavailable");
    mocks.findInitiative.mockRejectedValueOnce(databaseError);
    await expect(getPublishedInitiativeBySlug("invalid-private")).rejects.toThrow(databaseError);
    expect(mocks.findInitiative.mock.calls[0]?.[0]?.where).toMatchObject({
      slug: "invalid-private", status: "PUBLISHED", cause: { status: "PUBLISHED" },
    });
  });
});
