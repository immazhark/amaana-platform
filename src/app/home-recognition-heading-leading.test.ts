import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function unitlessLeading(css: string, selector: RegExp, shorthand = false) {
  const rule = css.match(selector);
  expect(rule, "Expected scoped public headline rule").not.toBeNull();
  const leading = shorthand
    ? rule![1]!.match(/(?:^|;)\s*font\s*:\s*[^;]*\/\s*([0-9.]+)\s+var\(--af-font-display\)/)
    : rule![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
  expect(leading, "Public multiline headline must specify unitless leading").not.toBeNull();
  return Number(leading![1]);
}

describe("AF-R025 remaining homepage and recognition headline leading", () => {
  it("keeps the homepage's actual carousel headline legible when it wraps", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/home-documentary.css"), "utf8");
    const ratio = unitlessLeading(css, /\.v3-home-banner-content\s+\.page-hero__title\s*\{([^}]*)\}/);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });

  it("keeps the recognition certificate's long display title legible", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/recognition/recognition-audit.module.css"), "utf8");
    const ratio = unitlessLeading(css, /\.document\s*>\s*strong\s*\{([^}]*)\}/, true);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
