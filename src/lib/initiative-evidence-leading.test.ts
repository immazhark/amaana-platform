import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/initiative-experience.css", "utf8");
function declaredLeading(selector: string): number {
  const block = css.split(selector + " {")[1]?.split("}")[0];
  expect(block, "Missing editorial rule: " + selector).toBeDefined();
  const value = /\bline-height:\s*(\d*\.?\d+)\s*;?/.exec(block!)?.[1];
  expect(value, "No explicit line-height for " + selector).toBeDefined();
  return Number(value);
}

describe("AF-R025 initiative evidence and fact leading", () => {
  it("keeps potentially multiline editorial text at readable unitless leading", () => {
    for (const selector of [".v2-initiative-evidence-panel p", ".v2-initiative-facts strong"]) {
      const lineHeight = declaredLeading(selector);
      expect(lineHeight, selector).toBeGreaterThanOrEqual(1.12);
      expect(lineHeight, selector).toBeLessThanOrEqual(1.24);
    }
  });

  it("does not alter large single-line evidence metrics as a side effect", () => {
    expect(declaredLeading(".v2-initiative-evidence-panel strong")).toBe(0.76);
  });
});
