import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("approved public media link accessible name begins with visible label", () => {
  const source = readFileSync(new URL("../src/components/public-media.tsx", import.meta.url), "utf8");
  assert.match(source, /aria-label=\{\`Open approved source: \$\{linkTitle\} \(new tab\)\`\}/);
  assert.match(source, />Open approved source ↗<\/a>/);
  assert.match(source, /rel="noopener noreferrer"/);
});
