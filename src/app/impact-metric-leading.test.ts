import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 published impact metric readability", () => {
  it("keeps multi-line verified outcome figures in the established readable leading range", () => {
    const page = readFileSync(
      resolve(process.cwd(), "src/app/impact/(overview)/page.tsx"), "utf8",
    );
    const css = readFileSync(
      resolve(process.cwd(), "src/app/impact/impact-refinement.module.css"), "utf8",
    );
    expect(page).toContain("<strong>{outcome.value}</strong>");
    const rule = css.match(/:global\(\.v2-impact-tile-copy\s+strong\)\s*\{([^}]*)\}/u);
    expect(rule, "Public impact figures need an explicit typography rule").not.toBeNull();
    const leading = rule?.[1]?.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/u);
    expect(leading, "The public metric needs explicit unitless leading").not.toBeNull();
    const ratio = Number(leading?.[1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.14);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
