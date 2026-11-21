import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 Team hero multiline heading", () => {
  it("preserves readable unitless line-height for the public Team hero", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/team/team.css"), "utf8");
    const rule = css.match(/\.team-hero h1\s*\{([^}]*)\}/);
    expect(rule, "Team hero typography must remain defined").not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*font\s*:[^;]*?\/([0-9.]+)\s+var\(--af-font-display\)/);
    expect(leading, "Hero font shorthand must define unitless leading").not.toBeNull();
    const ratio = Number(leading![1]);
    expect(Number.isFinite(ratio)).toBe(true);
    expect(ratio).toBeGreaterThanOrEqual(1.12);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
