import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 programme and editorial card heading leading", () => {
  it("keeps long card h3 labels in the approved 1.12–1.24 range", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/experience-finish.css"), "utf8");
    const rule = css.match(/:is\(\.v2-initiative-row,\.v3-work-card,\.canonical-pathways,\.v2-stories-card,\.v2-appeal-card\)\s*h3\s*\{([^}]*)\}/);
    expect(rule, "Shared public card heading selector is required").not.toBeNull();
    const match = rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(match, "Editorial card heading must declare unitless leading").not.toBeNull();
    const ratio = Number(match![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
