import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
function color(hex) {
  const channels = hex.match(/[\da-f]{2}/gi).map(value => parseInt(value, 16) / 255);
  return channels.map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
}
function contrast(a, b) {
  const luminance = hex => color(hex).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("admin eyebrow ink meets 4.5:1 on each surface", () => {
  assert.ok(css.includes(".admin-content .eyebrow{color:var(--af-color-navy-700)}"));
  assert.ok(css.includes(".admin-sidebar .eyebrow{color:var(--af-color-gold-soft)}"));
  assert.ok(!css.includes(".admin-shell .eyebrow{"));
  assert.ok(contrast("#2f4c7a", "#f5f7f6") >= 4.5, "content eyebrow must meet WCAG AA");
  assert.ok(contrast("#f0d56b", "#1d3150") >= 4.5, "sidebar eyebrow must meet WCAG AA");
});
