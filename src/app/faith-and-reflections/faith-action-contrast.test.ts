import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const page = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const css = readFileSync(new URL("../faith.css", import.meta.url), "utf8");
const surface = readFileSync(new URL("../../components/evidence-pathway.module.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../globals.css", import.meta.url), "utf8");
const experience = readFileSync(new URL("../experience-finish.css", import.meta.url), "utf8");
const pattern = readFileSync(new URL("../../../public/backgrounds/amaana-lattice-tile.svg", import.meta.url), "utf8");

type Rgb = readonly [number, number, number];

function tokenRgb(name: string): Rgb {
  const match = tokens.match(new RegExp(`--af-color-${name}:\\s*#([0-9a-f]{6})\\s*;`, "i"));
  expect(match, `Required approved navy token: ${name}`).not.toBeNull();
  const hex = match![1]!;
  return [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
}

function linear(value: number) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function luminance([red, green, blue]: Rgb) {
  return .2126 * linear(red) + .7152 * linear(green) + .0722 * linear(blue);
}

const overlay = ([r, g, b]: Rgb, [baseR, baseG, baseB]: Rgb, alpha: number): Rgb => [
  r * alpha + baseR * (1 - alpha),
  g * alpha + baseG * (1 - alpha),
  b * alpha + baseB * (1 - alpha),
];

it("keeps the real Faith closing action paragraph readable on its approved gradient and lattice", () => {
  expect(page).toMatch(/v2-section dark v2-faith-action \$\{evidenceStyles\.surface\}/);
  expect(page).toMatch(/v2-faith-action-grid.*?Where appropriate, reviewed content connects naturally/s);
  expect(surface).toMatch(/\.surface\.surface\{background-image:var\(--amaana-pattern\),linear-gradient\(132deg,var\(--af-color-navy-950\),var\(--af-color-navy-800\) 52%,var\(--af-color-navy-700\)\)!important/);
  const darkLayer = experience.match(/:is\(\.v2-section\.dark[^}]*\}/);
  expect(darkLayer?.[0]).toContain("background-blend-mode:normal,soft-light");
  // Soft-light over navy-800 darkens the opaque gradient's channel values.
  // Raw gradient stops are therefore conservative contrast surfaces.

  const ink = css.match(/\.v2-faith-action-grid>div:last-child>p\{color:rgb\(255 250 241 \/ (\d+)%\)/);
  expect(ink, "Audited closing paragraph ink must be explicit").not.toBeNull();
  const opacity = Number(ink![1]) / 100;

  const pigment = pattern.match(/fill="#([0-9a-f]{6})"/i);
  const lattice = pattern.match(/<rect[^>]*opacity="(0?\.\d+)"/);
  expect(pigment && lattice, "Actual approved lattice must be auditable").toBeTruthy();
  const hex = pigment![1]!;
  const gold: Rgb = [0, 2, 4].map(index => Number.parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
  const textureOpacity = Number(lattice![1]);
  expect(textureOpacity).toBeLessThanOrEqual(.1);

  for (const token of ["navy-950", "navy-800", "navy-700"]) {
    const stop = tokenRgb(token);
    for (const canvas of [stop, overlay(gold, stop, textureOpacity)]) {
      const text = overlay([255, 250, 241], canvas, opacity);
      const [light, dark] = [luminance(text), luminance(canvas)].sort((a, b) => b - a);
      expect((light! + .05) / (dark! + .05), `Faith action paragraph on ${token} and lattice`)
        .toBeGreaterThanOrEqual(4.5);
    }
  }
});
