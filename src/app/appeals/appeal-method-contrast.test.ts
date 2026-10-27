import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const moduleCss = readFileSync(new URL("./appeals-audit.module.css", import.meta.url), "utf8");
const sharedCss = readFileSync(new URL("../appeals.css", import.meta.url), "utf8");
const motionCss = readFileSync(new URL("../appeals-wow.css", import.meta.url), "utf8");
const globalInteractions = readFileSync(new URL("../experience-finish.css", import.meta.url), "utf8");
const pattern = readFileSync(new URL("../../../public/backgrounds/amaana-lattice-tile.svg", import.meta.url), "utf8");

type Rgb = readonly [number, number, number];

function luminance([red, green, blue]: Rgb) {
  const linear = (value: number) => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

function contrast(ink: Rgb, background: Rgb) {
  const a = luminance(ink);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

const overlay = ([r, g, b]: Rgb, [baseR, baseG, baseB]: Rgb, alpha: number): Rgb => [
  r * alpha + baseR * (1 - alpha),
  g * alpha + baseG * (1 - alpha),
  b * alpha + baseB * (1 - alpha),
];

describe("public Appeals verification method-card ink", () => {
  it("audits the actual three-card section, approved gradient and pattern", () => {
    expect(page).toMatch(/v2-appeal-method \$\{styles\.method\}/);
    expect(page.match(/<article><span>0[123]<\/span>/g)).toHaveLength(3);
    expect(moduleCss).toMatch(/\.method\.method\.method\{background:var\(--amaana-pattern\).*linear-gradient\(140deg,#0d1b2e,#1d3150 66%,#2f4c7a\)/);
    expect(pattern).toMatch(/<rect[^>]*opacity="\.10"/);
    expect(pattern).toMatch(/fill="#B99B65"/);
    expect(motionCss).toMatch(/\.v2-appeal-method-grid article:hover\{background:rgb\(255 255 255 \/ 3%\)/);
  });

  it("meets normal-text AA at every dark-gradient stop, with lattice and hover", () => {
    const legacyInk = sharedCss.match(/\.v2-appeal-method-grid p\{color:rgb\(255 250 241 \/ (\d+)%\)/);
    expect(legacyInk, "Unrecognized inherited paragraph ink").not.toBeNull();
    const scopedInk = moduleCss.match(/\.method :global\(\.v2-appeal-method-grid\) p\s*\{\s*color:\s*rgb\(255 250 241 \/ (\d+)%\);?\s*\}/);
    const alpha = Number((scopedInk ?? legacyInk)![1]) / 100;
    const ivory: Rgb = [255, 250, 241];
    const gold: Rgb = [185, 155, 101];

    for (const stop of [[13, 27, 46], [29, 49, 80], [47, 76, 122]] as const) {
      for (const patternAlpha of [0, 0.1]) {
        for (const hoverAlpha of [0, 0.03]) {
          const surface = overlay([255, 255, 255], overlay(gold, stop, patternAlpha), hoverAlpha);
          const ink = overlay(ivory, surface, alpha);
          expect(contrast(ink, surface), `Appeals card ink on ${stop.join(",")} with lattice ${patternAlpha} and hover ${hoverAlpha}`)
            .toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("keeps the premium hover sheen from covering these readable paragraphs", () => {
    expect(globalInteractions).toMatch(/\.v2-appeal-method-grid article[^}]*\)::after\{[^}]*z-index:5/);
    expect(moduleCss).toMatch(/\.method :global\(\.v2-appeal-method-grid\) article::after\s*\{\s*content:\s*none;?\s*\}/);
    expect(motionCss).toMatch(/\.v2-appeal-method-grid article:hover::before\{right:0\}/);
  });
});
