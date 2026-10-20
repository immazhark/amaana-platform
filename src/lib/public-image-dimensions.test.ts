import { describe, expect, it } from "vitest";
import { getPublicImageDimensions } from "./public-image-dimensions";

const fallback = { width: 1600, height: 1200 };

describe("public image dimension metadata", () => {
  it("preserves valid gallery image dimensions", () => {
    expect(getPublicImageDimensions({ width: 6000, height: 4000 })).toEqual({ width: 6000, height: 4000 });
  });

  it("accepts exactly the 40-million-pixel ingestion limit", () => {
    expect(getPublicImageDimensions({ width: 8000, height: 5000 })).toEqual({ width: 8000, height: 5000 });
  });

  it.each([
    ["one pixel over the area limit", { width: 8000, height: 5001 }],
    ["two individually valid dimensions exceeding the area limit", { width: 10000, height: 10000 }],
    ["oversized width", { width: 10001, height: 2000 }],
    ["non-finite width", { width: Infinity, height: 2000 }],
    ["fractional width", { width: 100.4, height: 2000 }],
    ["zero height", { width: 1000, height: 0 }],
    ["negative height", { width: 1000, height: -1 }],
    ["absent width", { width: null, height: 1000 }],
    ["absent height", { width: 1000, height: undefined }],
  ] as const)("falls back for %s", (_scenario, dimensions) => {
    expect(getPublicImageDimensions(dimensions)).toEqual(fallback);
  });
});
