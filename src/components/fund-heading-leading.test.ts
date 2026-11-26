import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("AF-R025 fund and Taleem heading leading", () => {
  it.each([
    ["fund-ledger/public-fund-ledger.module.css", /\.top h2\s*\{([^}]*)\}/],
    ["fund-giving/fund-giving.module.css", /\.heading\s*\{([^}]*)\}/],
  ] as const)("keeps %s within the reviewed unitless range", (path, selector) => {
    const css = readFileSync(new URL(path, import.meta.url), "utf8");
    const rule = css.match(selector);
    expect(rule).not.toBeNull();
    const leading = rule![1]!.match(/(?:^|;)\s*line-height:\s*([0-9.]+)\s*;/);
    expect(leading).not.toBeNull();
    const ratio = Number(leading![1]);
    expect(ratio).toBeGreaterThanOrEqual(1.14);
    expect(ratio).toBeLessThanOrEqual(1.24);
  });
});
