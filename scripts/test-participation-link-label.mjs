import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("participation card accessible name starts with visible action", () => {
  const source = readFileSync(new URL("../src/components/participation-card.tsx", import.meta.url), "utf8");
  assert.ok(source.includes('const ariaLabel = `${path.action}: ${path.title}'));
  assert.ok(source.includes('<span className={styles.action}>{path.action}'));
  assert.ok(source.includes('opens in a new tab'));
  assert.ok(source.includes('rel="noopener noreferrer"'));
});
