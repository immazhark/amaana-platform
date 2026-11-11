import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 Impact card programme headings", () => {
  it("keeps published programme title line boxes readable when titles wrap", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/impact/impact-refinement.module.css"),
      "utf8",
    );
    const rule = css.match(/:global\(\.v2-impact-tile-copy\s+h3\)\s*\{([^}]*)\}/);
    expect(rule, "Impact card title rule must remain explicit").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Impact programme title must declare unitless leading").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
