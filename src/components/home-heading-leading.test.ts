import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("AF-R025 homepage multi-line heading rhythm", () => {
  it("gives large home section headings enough leading when long text wraps", () => {
    const css = readFileSync(resolve(process.cwd(), "src/app/home-documentary.css"), "utf8");
    const rules = [...css.matchAll(/\.v3-home\s+\.v3-heading\s*\{([^}]*)\}/g)];
    expect(rules.length).toBeGreaterThan(0);
    const last = rules.at(-1)?.[1] ?? "";
    const leading = Number(last.match(/(?:^|;)\s*line-height\s*:\s*([\d.]+)/)?.[1]);
    expect(leading).toBeGreaterThanOrEqual(1.12);
  });
});
