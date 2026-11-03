import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 direct editorial heading line boxes", () => {
  it("keeps the global v2/v3 editorial title family legible when titles wrap", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/experience-finish.css"), "utf8");
    const titleRule = css.match(/:is\(\.v2-section-title,\.v3-heading\)\s*\{([^}]*)\}/);
    expect(titleRule, "Global direct editorial title selector must remain defined").not.toBeNull();

    const leading = titleRule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Direct headings must have explicit unitless leading").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
