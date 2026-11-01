import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const appCss = (name) => readFileSync(new URL(`../src/app/${name}`, import.meta.url), "utf8");

function inkToken(name) {
  const match = appCss("globals.css").match(new RegExp(`--af-color-${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i"));
  assert.ok(match, `Missing approved ${name} token`);
  return match[1];
}

function contrast(first, second) {
  const luminance = (hex) => {
    const channels = /^#([0-9a-f]{6})$/i.exec(hex)?.[1].match(/.{2}/g);
    assert.ok(channels, `Invalid color ${hex}`);
    return channels.reduce((sum, channel, index) => {
      const value = parseInt(channel, 16) / 255;
      const linear = value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
      return sum + linear * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  };
  const [light, dark] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function declaration(css, selector, property) {
  const rule = css.split("}").find((candidate) => candidate.split("{")[0].trim() === selector);
  assert.ok(rule, `Missing CSS rule ${selector}`);
  const body = rule.split("{")[1];
  const value = body.match(new RegExp(`(?:^|;)\\s*${property}:\\s*([^;]+)`, "i"))?.[1];
  assert.ok(value, `Missing ${property} in ${selector}`);
  return value.trim();
}

test("Media paper-card metadata uses readable ink without dark editorial regression", () => {
  const css = appCss("media.css");
  assert.equal(declaration(css, ".v2-media-link small", "color"), "var(--af-color-gold-ink)");
  assert.equal(declaration(css, ".v2-media-grid-editorial .v2-media-link small", "color"), "var(--v2-gold)");
  for (const paper of ["#fffdf8", "#faf6ec", "#f3eddd"]) {
    assert.ok(contrast(inkToken("gold-ink"), paper) >= 4.5, `Media label below 4.5:1 on ${paper}`);
  }
  assert.ok(contrast("#e0b318", "#1d3150") >= 4.5, "Editorial variant must keep readable gold on navy");
});
