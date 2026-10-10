import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("appeal card accessible action begins with visible action", () => {
  const source = readFileSync(new URL("../src/components/appeal-card.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('aria-label={`Understand this need: ${appeal.title}`}'));
  assert.ok(source.includes("<span>Understand this need</span>"));
});

test("faith library accessible action begins with visible action", () => {
  const source = readFileSync(new URL("../src/app/faith-and-reflections/page.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('aria-label={`Open reflection: ${item.title}`}'));
  assert.ok(source.includes('className="v2-faith-library-action">Open reflection ↗'));
});
