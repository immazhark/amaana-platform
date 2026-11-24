import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("impact tile accessible action begins with visible Explore impact", () => {
  const source = readFileSync(new URL("../src/app/impact/(overview)/page.tsx", import.meta.url), "utf8");
  // WCAG 2.5.3: the name starts with the visible action and carries the visible cause, outcome and title.
  assert.ok(source.includes('aria-label={`Explore impact: ${[item.cause.title, outcome?.value, outcome?.label, item.title]'));
  assert.ok(source.includes('className="v2-impact-tile-action" aria-hidden="true">Explore impact ↗'));
});
