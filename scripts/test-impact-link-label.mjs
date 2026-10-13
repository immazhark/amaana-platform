import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("impact tile accessible action begins with visible Explore impact", () => {
  const source = readFileSync(new URL("../src/app/impact/page.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('aria-label={`Explore impact: ${item.title}`}'));
  assert.ok(source.includes('className="v2-impact-tile-action" aria-hidden="true">Explore impact ↗'));
});
