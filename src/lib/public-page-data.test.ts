import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { PublicMedia } from "@/components/public-media";
import { generatePublicImagePlaceholder } from "./public-image-placeholder";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  initiativeFindMany: vi.fn(),
  appealFindMany: vi.fn(),
  mediaFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    initiative: {
      findMany: mocks.initiativeFindMany,
    },
    appeal: { findMany: mocks.appealFindMany },
    mediaAsset: { findFirst: mocks.mediaFindFirst },
  },
}));

import {
  getHomepageHeroMedia,
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
      expect(mediaQuery.select.blurDataURL).toBe(true);
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


describe("stored public preview query-to-render integration", () => {
  it.each([
    ["hero", "stored"], ["hero", "legacy"],
    ["completed", "stored"], ["completed", "legacy"],
  ])("carries %s / %s preview metadata from the lean query into PublicMedia", async (surface, mode) => {
    const bytes = await sharp({ create: { width: 12, height: 6, channels: 3, background: "#446FAA" } }).png().toBuffer();
    const blurDataURL = mode === "stored" ? await generatePublicImagePlaceholder(bytes, 40_000_000) : null;
    const asset = { id: "synthetic", kind: "IMAGE" as const, title: null, publicUrl: "/media/2026/synthetic.png", externalUrl: null, altText: "Synthetic test image", caption: null, sourceYear: null, width: 240, height: 120, blurDataURL };
    mocks.mediaFindFirst.mockImplementation(async ({ select }) => Object.fromEntries(Object.entries(asset).filter(([key]) => select[key] === true)));
    mocks.initiativeFindMany.mockImplementation(async ({ select }) => [{ slug: "synthetic", mediaAssets: [Object.fromEntries(Object.entries(asset).filter(([key]) => select.mediaAssets.select[key] === true))] }]);
    const media = surface === "hero" ? await getHomepageHeroMedia() : (await getCompletedAidShowcaseData())[0]!.mediaAssets[0]!;
    expect(media?.blurDataURL).toBe(blurDataURL);
    const query = surface === "hero" ? mocks.mediaFindFirst.mock.lastCall?.[0] : mocks.initiativeFindMany.mock.lastCall?.[0].select.mediaAssets;
    expect(query.where).toMatchObject({ isPublic: true, privacyApprovedAt: { not: null } });
    const html = renderToStaticMarkup(createElement(PublicMedia, { asset: media! }));
    expect(html).toContain('data-nimg="1"');
    if (mode === "stored") expect(html).toContain("background-image:url(");
    else expect(html).not.toContain("background-image:url(");
  });
});
