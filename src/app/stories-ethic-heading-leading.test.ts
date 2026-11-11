import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 stories editorial ethics heading reflow", () => {
  it("keeps all three semantic story ethics headings within the multiline leading range", () => {
    const css = readFileSync(
      resolve(process.cwd(), "src/app/stories/stories-audit.module.css"),
      "utf8",
    );
    const heading = css.match(/\.ethicList\s+article\s+h3\s*\{([^}]*)\}/);
    expect(heading, "The story ethic h3 heading rule must stay explicit").not.toBeNull();
    const leading = heading![1]!.match(/(?:^|;)\s*line-height\s*:\s*([0-9.]+)/);
    expect(leading, "Long editorial ethic headings need an explicit ratio").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
