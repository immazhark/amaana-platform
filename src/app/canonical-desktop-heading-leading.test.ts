import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 canonical article desktop heading leading", () => {
  it("keeps the >=1400px h2 override in the approved multiline editorial range", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/canonical-content.css"), "utf8");
    const rule = css.match(/@media\(min-width:1400px\)\s*\{[\s\S]*?\.canonical-article \.canonical-block h2\s*\{([^}]*)\}/);
    expect(rule, "Canonical desktop article heading override must be present").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Desktop canonical article h2 leading must be explicitly unitless").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
