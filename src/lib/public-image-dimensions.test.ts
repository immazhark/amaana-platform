import { describe, expect, it } from "vitest";
import { getPublicImageDimensions } from "./public-image-dimensions";

describe("common intrinsic image dimension contract", () => {
  const fallback = { width: 1600, height: 1200 };
  it("preserves real, valid image geometry for portrait, square and wide frames", () => {
    for (const asset of [
      { width: 960, height: 1280 }, { width: 800, height: 800 },
      { width: 4032, height: 3024 }, { width: 10000, height: 500 },
    ]) expect(getPublicImageDimensions(asset)).toEqual(asset);
  });
  it.each([
    { width: null, height: 800 }, { width: 1200, height: null },
    { width: undefined, height: undefined }, { width: 0, height: 800 },
    { width: -1, height: 500 }, { width: Infinity, height: 800 },
    { width: 800, height: NaN }, { width: 800.5, height: 800 },
    { width: 10001, height: 100 }, { width: 300, height: -200 },
  ])("uses a consistent 4:3 fallback for unusable dimensions %j", input => {
    expect(getPublicImageDimensions(input)).toEqual(fallback);
  });
});
