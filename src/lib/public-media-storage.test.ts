import { describe, expect, it } from "vitest";
import {
  MAX_PUBLIC_IMAGE_PIXELS,
  validatePublicImageDimensions,
} from "./storage";

describe("public media image dimension contract", () => {
  it("accepts verified dimensions within the decoded-pixel safety budget", () => {
    expect(validatePublicImageDimensions({ width: 6000, height: 4000 })).toEqual({ width: 6000, height: 4000 });
  });

  it("fails closed when dimensions are missing, invalid or exceed the pixel budget", () => {
    expect(() => validatePublicImageDimensions(null)).toThrow(/dimensions could not be verified/i);
    expect(() => validatePublicImageDimensions({ width: 0, height: 1200 })).toThrow(/dimensions could not be verified/i);
    expect(() => validatePublicImageDimensions({ width: 1.5, height: 1200 })).toThrow(/dimensions could not be verified/i);

    const overBudgetWidth = Math.floor(MAX_PUBLIC_IMAGE_PIXELS / 2) + 1;
    expect(() => validatePublicImageDimensions({ width: overBudgetWidth, height: 2 })).toThrow(/pixel safety limit/i);
  });
});
