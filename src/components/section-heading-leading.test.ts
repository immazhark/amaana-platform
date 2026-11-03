import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 public SectionHeading multiline line boxes", () => {
  it("keeps shared section title leading at a readable unitless ratio", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/components/section-heading.module.css"),
      "utf8",
    );
    const titleRule = css.match(/\.heading\.heading\s+:global\(\.v2-section-title\)\s*\{([^}]*)\}/);
    expect(titleRule, "Shared SectionHeading must retain its scoped title rule").not.toBeNull();

    const leading = titleRule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Multiline title leading must remain explicit").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
