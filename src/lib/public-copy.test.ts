
import { describe, expect, it } from "vitest";
import { distinctStoryParagraphs } from "./public-copy";

describe("distinctStoryParagraphs", () => {
  it("removes a body paragraph that repeats the hero summary", () => {
    expect(distinctStoryParagraphs(
      "Amaana distributed 90 kg of dates in 2024.",
      "Amaana distributed 90 kg of dates in 2024."
    )).toEqual([]);
  });

  it("keeps distinct implementation and outcome paragraphs", () => {
    expect(distinctStoryParagraphs(
      "Amaana distributed 90 kg of dates in 2024.",
      "Boxes were prepared before distribution.\n\nThe initiative continued the annual programme."
    )).toHaveLength(2);
  });

  it("normalizes punctuation and whitespace before comparison", () => {
    expect(distinctStoryParagraphs(
      "A documented outcome — shared responsibly.",
      "  A documented outcome - shared responsibly.  "
    )).toEqual([]);
  });
});
