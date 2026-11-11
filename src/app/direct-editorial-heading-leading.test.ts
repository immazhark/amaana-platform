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

describe("AF-R025 conditional programme infographic heading leading", () => {
  it("keeps the campaign data visual title readable when its conditional copy wraps", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/our-work/[slug]/campaign.css"),
      "utf8",
    );
    const rule = css.match(/\.campaign-data-visual\s+h2\s*\{([^}]*)\}/);
    expect(rule, "Programme data visual must keep an explicit title rule").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Conditional multiline heading leading must remain explicit").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});

describe("AF-R025 education sponsorship multiline headings", () => {
  it("keeps both school and closing sponsorship titles in the approved heading leading range", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/get-involved/sponsor-education/sponsor-education.css"),
      "utf8",
    );
    const rule = css.match(/\.taleem-school\s+h2\s*,\s*\.taleem-closing\s+h2\s*\{([^}]*)\}/);
    expect(rule, "Both sponsorship headings must retain their shared explicit rule").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*font\s*:[^;]*?\/([0-9.]+)\s+var\(--af-font-display\)/);
    expect(leading, "Both heading font shorthands must include unitless leading").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
