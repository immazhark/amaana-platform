import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CampaignMediaGallery } from "@/components/campaign-media-gallery";
import { PublicMedia } from "@/components/public-media";
import { getPublicImageDimensions } from "./public-image-dimensions";

const fallback = { width: 1600, height: 1200 };

describe("approved public image intrinsic dimensions", () => {
  it("preserves valid portrait, landscape and square geometry", () => {
    for (const valid of [
      { width: 960, height: 1280 },
      { width: 800, height: 800 },
      { width: 4032, height: 3024 },
      { width: 10000, height: 500 },
      { width: 8000, height: 5000 },
    ]) expect(getPublicImageDimensions(valid)).toEqual(valid);
  });

  it.each([
    { width: null, height: 800 },
    { width: 1200, height: null },
    { width: undefined, height: undefined },
    { width: 0, height: 800 },
    { width: -1, height: 500 },
    { width: Infinity, height: 800 },
    { width: 800, height: NaN },
    { width: 800.5, height: 800 },
    { width: 10001, height: 100 },
    { width: 300, height: -200 },
  ])("uses a consistent 4:3 fallback for invalid input %j", input => {
    expect(getPublicImageDimensions(input)).toEqual(fallback);
  });

  it.each([
    { width: 8000, height: 5001 },
    { width: 10000, height: 10000 },
  ])("rejects public image metadata over the 40 MP ingestion cap: %j", input => {
    expect(getPublicImageDimensions(input)).toEqual(fallback);
  });

  it("applies safe intrinsic dimensions in public-media rendering", () => {
    const html = renderToStaticMarkup(createElement(PublicMedia, {
      asset: {
        id: "fixture",
        kind: "IMAGE",
        title: null,
        publicUrl: "/media/2026/fixture.jpg",
        externalUrl: null,
        altText: "Reviewed photograph",
        caption: null,
        sourceYear: null,
        width: Infinity,
        height: 800.5,
      },
    }));
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1200"');
    expect(html).not.toContain('width="Infinity"');
  });

  it("applies the same fallback to gallery tiles and not just the expanded image", () => {
    const html = renderToStaticMarkup(createElement(CampaignMediaGallery, {
      items: [{ id: "fixture", url: "/media/2026/fixture.jpg", alt: "Reviewed photograph", width: 800.5, height: 900 }],
    }));
    expect(html).toContain('width="1600"');
    expect(html).toContain('height="1200"');
    expect(html).not.toContain('width="800.5"');

    const oversized = renderToStaticMarkup(createElement(CampaignMediaGallery, {
      items: [{ id: "oversized", url: "/media/2026/oversized.jpg", alt: "Reviewed photograph", width: 10000, height: 10000 }],
    }));
    expect(oversized).toContain('width="1600"');
    expect(oversized).toContain('height="1200"');
  });
});
