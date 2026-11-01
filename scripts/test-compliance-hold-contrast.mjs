import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/app/trust-experience.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/compliance/page.tsx", import.meta.url), "utf8");
const surface = readFileSync(new URL("../src/components/evidence-pathway.module.css", import.meta.url), "utf8");
const pattern = readFileSync(new URL("../public/backgrounds/amaana-lattice-tile.svg", import.meta.url), "utf8");

function linear(value) {
  const channel = value / 255;
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground, background) {
  const luminance = rgb => rgb.reduce((sum, channel, index) => sum + linear(channel) * [0.2126, 0.7152, 0.0722][index], 0);
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function inkOpacity() {
  const match = css.match(/\.v2-compliance-hold p\{color:rgb\(255 250 241 \/ (\d+)%\);line-height:1\.65\}/);
  assert.ok(match, "Compliance body ink must be an audited off-white alpha");
  return Number(match[1]) / 100;
}

function panelOpacity() {
  const match = css.match(/\.v2-compliance-hold\{[^}]*background:rgb\(255 255 255 \/ (\d+)%\)/);
  assert.ok(match, "Compliance panel surface alpha missing");
  return Number(match[1]) / 100;
}

test("visible compliance hold paragraph meets AA on approved dark gradient stops", () => {
  assert.match(page, /v2-section dark v2-compliance-pending/);
  assert.match(page, /className="v2-compliance-hold"/);
  assert.match(surface, /--af-color-navy-950\),var\(--af-color-navy-800\) 52%,var\(--af-color-navy-700\)/);
  const art = pattern.match(/<rect[^>]+opacity="(0?\.\d+)"/);
  const pigment = pattern.match(/fill="#([a-f0-9]{6})"/i);
  assert.ok(art && pigment, "Approved low-opacity lattice pigment must remain auditable");
  const textureOpacity = Number(art[1]);
  assert.ok(textureOpacity <= 0.1, "Unreviewed lattice opacity increase");
  const gold = pigment[1].match(/.{2}/g).map(hex => parseInt(hex, 16));
  const alpha = inkOpacity();
  const panel = panelOpacity();
  for (const token of ["navy-950", "navy-800", "navy-700"]) {
    const match = tokens.match(new RegExp(`--af-color-${token}:\\s*#([0-9a-f]{6})\\s*;`, "i"));
    assert.ok(match, `Missing dark surface token ${token}`);
    const background = match[1].match(/.{2}/g).map(hex => parseInt(hex, 16));
    // The optional gold lattice lies over an opaque approved navy gradient.
    // Check both uncovered pixels and the most saturated approved 10% overlay.
    for (const base of [background, background.map((channel, index) =>
      channel * (1 - textureOpacity) + gold[index] * textureOpacity)]) {
      const panelSurface = base.map(channel => channel * (1 - panel) + 255 * panel);
      const text = [255, 250, 241].map((channel, index) => channel * alpha + panelSurface[index] * (1 - alpha));
      assert.ok(contrast(text, panelSurface) >= 4.5, `Compliance hold paragraph below 4.5:1 on ${token} with lattice`);
    }
  }
});
