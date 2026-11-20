import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// The repo's browser audit (e2e/all-page-audit.spec.mjs) runs axe with the
// enhanced contrast rule, so small badge text must reach 7:1, not only the AA
// 4.5:1. That audit measured the tinted "Zakat not accepted" pill on the public
// funds ledger as #f3ede2 and failed the 6.18:1 pair. This guard reads the
// shipped CSS and resolves the real token, so the pair cannot regress silently.
const PILL_BACKGROUND = "#f3ede2";
const ENHANCED_CONTRAST = 7;

const globals = readFileSync(resolve(process.cwd(), "src/app/globals.css"), "utf8");

function tokenHex(name: string) {
  const hex = globals.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`))?.[1];
  expect(hex, `design token ${name} must be a literal hex colour`).toBeDefined();
  return hex!;
}

function luminance(hex: string) {
  const channel = (index: number) => {
    const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

function contrast(foreground: string, background: string) {
  const [a, b] = [luminance(foreground), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function nonZakatTextToken(cssPath: string) {
  const css = readFileSync(resolve(process.cwd(), cssPath), "utf8");
  const rule = css.match(/\.tag\[data-policy="non-zakat"\]\s*\{([^}]*)\}/)?.[1];
  expect(rule, `missing non-zakat badge rule in ${cssPath}`).toBeDefined();
  const token = rule?.match(/(?:^|[;\s])color:\s*var\((--af-color-[a-z0-9-]+)\)/)?.[1];
  expect(token, `non-zakat badge text in ${cssPath} must use a design token`).toBeDefined();
  return token!;
}

describe("fund Zakat-policy badge contrast", () => {
  it.each([
    "src/components/fund-ledger/public-fund-ledger.module.css",
    "src/components/fund-giving/fund-giving.module.css",
  ])("%s non-Zakat badge text reaches 7:1 on its tinted pill", cssPath => {
    const ink = tokenHex(nonZakatTextToken(cssPath));
    expect(contrast(ink, PILL_BACKGROUND)).toBeGreaterThanOrEqual(ENHANCED_CONTRAST);
  });

  it("the model reproduces the pair the audit rejected", () => {
    // Guards the guard: the old warning ink on that pill must stay below 7:1,
    // matching axe's 6.17:1, so a threshold or formula drift is noticed.
    expect(contrast(tokenHex("--af-color-warning"), PILL_BACKGROUND)).toBeLessThan(ENHANCED_CONTRAST);
    expect(contrast(tokenHex("--af-color-warning"), PILL_BACKGROUND)).toBeGreaterThan(6.1);
  });
});
