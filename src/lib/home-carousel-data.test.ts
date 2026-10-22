import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMedia: vi.fn(),
  reviewMediaBatch: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: { findMany: mocks.findMedia },
  },
}));
vi.mock("@/lib/public-page-data", () => ({
  getAppealCoverMediaBatch: mocks.reviewMediaBatch,
}));

import { getHomeCarouselImages } from "./home-carousel-data";

describe("homepage reviewed media batching", () => {
  beforeEach(() => {
    mocks.findMedia.mockReset();
    mocks.reviewMediaBatch.mockReset();
  });

  it("reviews configured slide assets and appeal covers in one batch without duplicate URLs", async () => {
    const configuredUrl = "/media/configured.webp";
    const appealUrl = "/media/appeal.webp";
    const configured = {
      id: "verified-media", kind: "IMAGE", title: null, publicUrl: configuredUrl,
      externalUrl: null, altText: "Reviewed image", caption: null,
      sourceYear: 2026, width: 1536, height: 1024, sortOrder: -1000,
    };
    const appeal = { ...configured, id: "reviewed-appeal", publicUrl: appealUrl };
    mocks.findMedia.mockResolvedValueOnce([{ id: configured.id, publicUrl: configuredUrl }]);
    mocks.reviewMediaBatch.mockResolvedValueOnce(new Map([
      [configuredUrl, configured], [appealUrl, appeal],
    ]));

    const result = await getHomeCarouselImages(
      ["asset:verified-media", "asset:verified-media", "origin"],
      [appealUrl, appealUrl, configuredUrl, null],
    );

    expect(mocks.findMedia).toHaveBeenCalledOnce();
    expect(mocks.findMedia.mock.calls[0]?.[0]).toMatchObject({
      where: {
        id: { in: ["verified-media"] },
        kind: "IMAGE",
        isPublic: true,
        privacyApprovedAt: { not: null },
      },
    });
    expect(mocks.reviewMediaBatch).toHaveBeenCalledOnce();
    expect(mocks.reviewMediaBatch.mock.calls[0]?.[0]).toEqual([configuredUrl, appealUrl]);
    expect(result.images.get(configured.id)).toEqual(configured);
    expect(result.coverByUrl.get(appealUrl)).toEqual(appeal);
  });

  it("never elevates media absent from the review result and skips empty provider calls", async () => {
    mocks.findMedia.mockResolvedValueOnce([
      { id: "unreviewed", publicUrl: "/media/unreviewed.webp" },
    ]);
    mocks.reviewMediaBatch.mockResolvedValueOnce(new Map());

    const result = await getHomeCarouselImages(["asset:unreviewed"], ["/media/unreviewed.webp"]);
    expect(result.images.size).toBe(0);
    expect(result.coverByUrl.size).toBe(0);
    expect(mocks.reviewMediaBatch).toHaveBeenCalledOnce();
  });

  it("returns empty maps without querying media when neither carousel nor appeals use image URLs", async () => {
    const result = await getHomeCarouselImages(["origin", "eid"], [null, undefined, ""]);
    expect(result.images.size).toBe(0);
    expect(result.coverByUrl.size).toBe(0);
    expect(mocks.findMedia).not.toHaveBeenCalled();
    expect(mocks.reviewMediaBatch).not.toHaveBeenCalled();
  });
});
