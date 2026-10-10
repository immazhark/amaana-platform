import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function luminance(hex) {
  const rgb = hex.match(/[a-f0-9]{2}/gi)?.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  if (!rgb || rgb.length !== 3) throw new Error("Invalid six-digit color");
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}

function contrast(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("muted metadata token reaches WCAG AA on public light surfaces", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  const match = css.match(/--af-color-meta:\s*(#[0-9a-f]{6})\s*;/i);
  assert.ok(match, "Semantic metadata token must exist");
  for (const background of ["#faf6ec", "#fffdf8", "#f3eddd"]) {
    assert.ok(contrast(match[1], background) >= 4.5, `Metadata contrast fails on ${background}`);
  }
});

test("public media caption and appeal card copy use metadata token", () => {
  const media = readFileSync(new URL("../src/app/media.css", import.meta.url), "utf8");
  const appeal = readFileSync(new URL("../src/app/appeal-card.css", import.meta.url), "utf8");
  assert.match(media, /\.v2-media-item figcaption\s*\{[^}]*color:\s*var\(--af-color-meta\)/);
  assert.match(appeal, /\.v2-appeal-card p\s*\{[^}]*color:\s*var\(--af-color-meta\)/);
  assert.doesNotMatch(media, /color:\s*#68717a/i);
  assert.doesNotMatch(appeal, /color:\s*#68717a/i);
});

test("semantic ink tokens meet AA contrast across light surfaces", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  for (const name of ["label", "meta", "accent-text"]) {
    const match = css.match(new RegExp("--af-color-" + name + ":\\\\s*(#[0-9a-f]{6})\\\\s*;", "i"));
    assert.ok(match, "Missing semantic ink token: " + name);
    for (const background of ["#faf6ec", "#fffdf8", "#f3eddd"]) {
      assert.ok(contrast(match[1], background) >= 4.5, name + " contrast below WCAG AA on " + background);
    }
  }
});

test("policy labels and aside copy use semantic label ink", () => {
  const css = readFileSync(new URL("../src/app/accessibility.css", import.meta.url), "utf8");
  assert.match(css, /\\.v2-policy-page \\.v2-section-label\\s*\\{color:var\\(--af-color-label\\)!important\\}/);
  assert.match(css, /\\.v2-policy-page aside>p\\s*\\{color:var\\(--af-color-label\\)!important\\}/);
  assert.doesNotMatch(css, /#5f4b31/i);
});
