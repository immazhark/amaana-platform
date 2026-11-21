import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 canonical trust-evidence heading", () => {
  it("keeps the actual trust-evidence h2 override readable when its title wraps", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/canonical-content.css"), "utf8");
    const rule = css.match(/\.canonical-body>\[data-trust-evidence-boundary\] \.v2-section-title\s*\{([^}]*)\}/);
    expect(rule, "Explicit canonical trust-evidence title selector must remain").not.toBeNull();
    const leading = rule![1]?.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Trust title must declare a unitless line-height").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
