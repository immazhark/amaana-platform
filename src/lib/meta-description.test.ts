import { describe, expect, it } from "vitest";
import { metaDescription } from "./meta-description";

const LONG = "A synthetic programme summary describes how a verified need was reviewed, supported and reported to donors in plain language. It continues with a second sentence that adds more detail than a search result can show.";

describe("metaDescription", () => {
  it("returns a short description unchanged apart from whitespace", () => {
    expect(metaDescription("  A short\n description.  ")).toBe("A short description.");
  });

  it("clips at the last sentence boundary that fits, without an ellipsis", () => {
    const out = metaDescription(LONG);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("plain language.")).toBe(true);
  });

  it("does not treat a decimal point as a sentence boundary", () => {
    const text = "A synthetic route of 2.5 km was documented with a verified beneficiary list and reviewed distribution notes for every household in the lane";
    const out = metaDescription(text + " and more words follow here to pass the limit.");
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out).not.toMatch(/2\.$/);
    expect(out.endsWith("…")).toBe(true);
  });

  it("clips at a word boundary with an ellipsis when no sentence ends early enough", () => {
    const text = "word ".repeat(60).trim();
    const out = metaDescription(text);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(out.endsWith("…")).toBe(true);
    expect(out.slice(0, -1).split(" ").every(part => part === "word")).toBe(true);
    expect(out).not.toMatch(/[,;:–—-]…$/);
  });

  it("never leaves a lone high surrogate when the limit cuts an emoji", () => {
    const text = "x".repeat(152) + "🌙🌙🌙 more text follows after the emoji sequence";
    const out = metaDescription(text);
    expect(out.length).toBeLessThanOrEqual(155);
    expect(/[\uD800-\uDBFF]…?$/.test(out)).toBe(false);
  });

  it("honours a custom limit", () => {
    expect(metaDescription(LONG, 80).length).toBeLessThanOrEqual(80);
  });
});
