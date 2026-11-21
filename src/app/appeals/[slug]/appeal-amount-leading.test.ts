import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 public appeal funding amount typography", () => {
  it("keeps wrapped INR totals legible inside the responsive funding panel", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/appeals/[slug]/appeal-detail-layout.module.css"),
      "utf8",
    );
    const page = readFileSync(
      resolve(process.cwd(), "src/app/appeals/[slug]/page.tsx"),
      "utf8",
    );

    expect(page).toContain("className={fundingStyles.metric}");
    const rule = css.match(/\.metric\s*>\s*strong\s*\{([^}]*)\}/u);
    expect(rule, "The appeal amount must retain its own typography rule").not.toBeNull();
    const leading = rule?.[1]?.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/u);
    expect(leading, "The appeal amount must have explicit unitless line height").not.toBeNull();
    const ratio = Number(leading?.[1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.14);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
