import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appeals = readFileSync(new URL("../src/app/appeals.css", import.meta.url), "utf8");
const surfaces = readFileSync(new URL("../src/app/experience-finish.css", import.meta.url), "utf8");
const tokens = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
const page = readFileSync(new URL("../src/app/appeals/[slug]/page.tsx", import.meta.url), "utf8");

function relativeLuminance(rgb) {
  return rgb.reduce((sum, channel, index) => {
    const value = channel / 255;
    const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    return sum + linear * [0.2126, 0.7152, 0.0722][index];
  }, 0);
}

function contrast(foreground, background) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function updateColor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const rule = appeals.match(new RegExp(`${escaped}\\{([^}]+)\\}`));
  assert.ok(rule, `Missing update text selector ${selector}`);
  const color = rule[1].match(/(?:^|;)\s*color:rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)%\)/);
  assert.ok(color, `Expected auditable opaque-channel/alpha CSS ink at ${selector}`);
  return { rgb: color.slice(1, 4).map(Number), alpha: Number(color[4]) / 100 };
}

function gradientStops() {
  const gradient = surfaces.match(/--af-surface-dark:linear-gradient\(132deg,([^;]+)\),var\(--af-surface-art\)/);
  assert.ok(gradient, "The public dark surface gradient must remain auditable");
  assert.match(surfaces, /background-color:var\(--af-color-navy-800\)!important/);
  const stops = Array.from(gradient[1].matchAll(/rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*(\d+)%\)/g));
  assert.equal(stops.length, 3, "Expected three verified public dark gradient stops");
  return stops.map((stop) => ({ rgb: stop.slice(1, 4).map(Number), alpha: Number(stop[4]) / 100 }));
}

function darkFallback() {
  const token = tokens.match(/--af-color-navy-800:\s*#([0-9a-f]{6})\s*;/i);
  assert.ok(token, "Approved dark surface fallback is missing");
  return token[1].match(/.{2}/g).map((part) => parseInt(part, 16));
}

for (const [selector, label] of [
  [".v2-appeal-update-line small", "date"],
  [".v2-appeal-update-line p", "body"],
]) {
  test(`published appeal update ${label} meets 4.5:1 against all dark stops`, () => {
    assert.match(page, /className="v2-section dark v2-appeal-updates"/);
    assert.match(page, /className="v2-appeal-update-line"/);
    const { rgb, alpha } = updateColor(selector);
    for (const stop of gradientStops()) {
      // The first gradient layer overlays the approved navy fallback and faint
      // textured artwork. White is an upper-bound underlay, not a sampled pixel.
      for (const underlay of [darkFallback(), [255, 255, 255]]) {
        const background = stop.rgb.map((channel, index) =>
          channel * stop.alpha + underlay[index] * (1 - stop.alpha));
        const renderedInk = rgb.map((channel, index) => channel * alpha + background[index] * (1 - alpha));
        assert.ok(contrast(renderedInk, background) >= 4.5,
          `Appeal update ${label} fails 4.5:1 at stop ${stop.rgb.join(",")} over ${underlay.join(",")}`);
      }
    }
  });
}
