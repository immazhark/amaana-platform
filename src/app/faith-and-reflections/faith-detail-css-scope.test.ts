import { readFileSync } from "node:fs";
import { expect, test } from "vitest";

const sharedLayout = readFileSync(new URL("./layout.tsx", import.meta.url), "utf8");
const detailPage = readFileSync(new URL("./[slug]/page.tsx", import.meta.url), "utf8");
const sharedCss = readFileSync(new URL("../faith-wow.css", import.meta.url), "utf8");
const detailCss = readFileSync(new URL("../faith-detail.css", import.meta.url), "utf8");

test("Faith detail-only CSS belongs to the article page, not the library layout", () => {
  expect(sharedLayout).not.toContain('import "../faith-detail.css"');
  expect(detailPage).toContain('import "../../faith-detail.css"');
  expect(detailCss).toContain(".v2-faith-detail-body-grid");
  expect(detailPage).toContain("v2-faith-detail-body-grid");
});

test("Faith library card styling and keyboard focus remain shared by both routes", () => {
  const sharedRules = [
    ".v2-faith-library-item{color:inherit;text-decoration:none}",
    ".v2-faith-library-action{display:block;margin-top:auto;padding-top:1.5rem;color:var(--v2-gold);font-size:.76rem;letter-spacing:.03em}",
    ".v2-faith-library-item:focus-visible{outline:3px solid var(--v2-gold);outline-offset:4px}",
  ];
  for (const rule of sharedRules) expect(sharedCss).toContain(rule);
  expect(detailCss).not.toContain(".v2-faith-library-");
});

test("AF-R019 Faith library action ink stays legible on pale paper and cream cards", () => {
  const declarations = [...sharedCss.matchAll(/\\.v2-faith-library-action\\s*\\{([^}]*)\\}/g)];
  expect(declarations.length).toBeGreaterThan(0);
  const lastRule = declarations.at(-1)?.[1] ?? "";
  expect(lastRule).toMatch(/(?:^|;)\\s*color:\\s*var\\(--amaana-gold-deep\\)/);
  const brandCss = readFileSync(new URL("../brand.css", import.meta.url), "utf8");
  const globalCss = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
  expect(brandCss).toContain("--amaana-gold-deep: var(--af-color-gold-ink)");
  expect(globalCss).toContain("--af-color-gold-ink: #604407");

  const brightness = (hex: string) => {
    const rgb = hex.match(/[a-f0-9]{2}/gi);
    expect(rgb).toHaveLength(3);
    return (rgb ?? []).reduce((sum, channel, i) => {
      const v = Number.parseInt(channel, 16) / 255;
      const linear = v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][i]!;
    }, 0);
  };
  for (const surface of ["#fffdf8", "#faf6ec"]) {
    const fg = brightness("#604407");
    const bg = brightness(surface);
    expect((Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05)).toBeGreaterThanOrEqual(4.5);
  }
});
