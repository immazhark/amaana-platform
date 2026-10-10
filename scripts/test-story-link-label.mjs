import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("story archive link accessible name begins with visible Read story", () => {
  const source = readFileSync(new URL("../src/app/stories/page.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('aria-label={`Read story: ${story.title}`}'));
  assert.ok(source.includes("<b>Read story ↗</b>"));
});
