import { describe, expect, it } from "vitest";
import { boundedCarouselScrollLeft, closestCarouselIndex } from "./carousel-position";

describe("browser-reachable carousel geometry", () => {
  it("clamps unreachable slide positions at either viewport boundary", () => {
    expect(boundedCarouselScrollLeft(900, 1200, 500)).toBe(700);
    expect(boundedCarouselScrollLeft(-25, 1200, 500)).toBe(0);
    expect(boundedCarouselScrollLeft(80, 400, 500)).toBe(0);
  });
  it("retains normal intermediate offsets on overflowed rails", () => {
    expect(boundedCarouselScrollLeft(280, 1600, 400)).toBe(280);
    expect(closestCarouselIndex([0, 280, 560, 840], 300, 1600, 400)).toBe(1);
  });
  it("chooses the final card at a clamped track edge", () => {
    const offsets = [0, 320, 640, 960, 1280];
    expect(closestCarouselIndex(offsets, 1100, 1500, 400)).toBe(4);
    expect(closestCarouselIndex(offsets, 1070, 1500, 400)).toBe(4);
  });
  it("ignores detached slide nodes and gives a deterministic empty fallback", () => {
    expect(closestCarouselIndex([0, null, 450], 450, 900, 450)).toBe(2);
    expect(closestCarouselIndex([null, null], 120, 800, 400)).toBe(0);
  });
});
