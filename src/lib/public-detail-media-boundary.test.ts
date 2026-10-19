import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initiative: vi.fn(),
  story: vi.fn(),
  faith: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    initiative: { findFirst: mocks.initiative },
    story: { findFirst: mocks.story },
    faithContent: { findFirst: mocks.faith },
  },
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
}));

import {
  PUBLIC_DETAIL_MEDIA_LIMIT,
  getPublishedFaithContentBySlug,
  getPublishedInitiativeBySlug,
  getPublishedStoryBySlug,
} from "./public-content";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.initiative.mockResolvedValue(null);
  mocks.story.mockResolvedValue(null);
  mocks.faith.mockResolvedValue(null);
});

describe("public detail media query boundary", () => {
  it.each([
    ["initiative", getPublishedInitiativeBySlug, mocks.initiative],
    ["story", getPublishedStoryBySlug, mocks.story],
    ["faith", getPublishedFaithContentBySlug, mocks.faith],
  ])("caps %s initial media and projects no private storage fields", async (_kind, read, queryMock) => {
    await read("approved-entry");
    expect(queryMock).toHaveBeenCalledOnce();
    const relation = queryMock.mock.calls[0]?.[0]?.include?.mediaAssets;
    expect(relation.take).toBe(PUBLIC_DETAIL_MEDIA_LIMIT);
    expect(PUBLIC_DETAIL_MEDIA_LIMIT).toBe(48);
    expect(relation.where).toMatchObject({
      isPublic: true,
      privacyApprovedAt: { not: null },
    });
    expect(relation.orderBy).toEqual([
      { sortOrder: "asc" },
      { sourceYear: "desc" },
      { createdAt: "desc" },
    ]);
    expect(relation.select).toMatchObject({
      id: true,
      publicUrl: true,
      externalUrl: true,
      altText: true,
      width: true,
      height: true,
    });
    for (const field of ["storageKey", "sourcePath", "privacyApprovedAt", "createdAt"]) {
      expect(relation.select).not.toHaveProperty(field);
    }
  });
});
