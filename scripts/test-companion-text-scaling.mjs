import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const companion = readFileSync(new URL("../src/app/islamic-companion.css", import.meta.url), "utf8");

test("Companion content typography follows root text enlargement", () => {
  // Fixed pixel font sizes do not respond to increased root text size.
  // Pixel dimensions for layout/borders remain permitted.
  assert.doesNotMatch(companion, /\b(?:font-size|font)\s*:\s*\d+(?:\.\d+)?px\b/i);
  assert.match(companion, /\.amaana-companion-panel\s+\.amaana-companion-note\s*\{[^}]*font-size:\s*\.75rem/s);
  assert.match(companion, /\.amaana-next-salah span\s*\{[^}]*font-size:\s*\.75rem/s);
  assert.match(companion, /\.amaana-daily-ayah blockquote\s*\{[^}]*font:\s*1\.25rem/s);
});

test("Enlarged prayer labels retain valid wrapping declarations", () => {
  assert.doesNotMatch(companion, /\\n/);
  for (const selector of [".amaana-next-salah strong", ".amaana-salah-times>div"]) {
    const start = companion.indexOf(selector + "{");
    assert.notEqual(start, -1, selector);
    const rule = companion.slice(start, companion.indexOf("}", start) + 1);
    assert.match(rule, /\{\s*flex-wrap:\s*wrap;/);
    assert.match(rule, /display:\s*flex;/);
  }
});
