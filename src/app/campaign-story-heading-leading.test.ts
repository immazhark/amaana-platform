import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 programme detail story heading", () => {
  it("keeps the programme story h2 readable when its text wraps", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/our-work/[slug]/campaign.css"), "utf8");
    const rule = css.match(/\.campaign-story-layout\s+h2\s*\{([^}]*)\}/);
    expect(rule, "Programme story must keep an explicit title rule").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Programme story title leading must stay explicit").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
