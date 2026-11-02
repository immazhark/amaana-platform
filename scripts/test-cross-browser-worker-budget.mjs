import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const config = readFileSync("playwright.cross-browser.config.mjs", "utf8");
const smoke = readFileSync("e2e/cross-browser-smoke.spec.mjs", "utf8");
const workflow = readFileSync(".github/workflows/ci.yml", "utf8");

test("CI runs Firefox and WebKit together without omitting either project or retries", () => {
  assert.match(config, /workers:\s*process\.env\.CI\s*\?\s*2\s*:\s*1,/);
  assert.match(config, /fullyParallel:\s*false,/);
  assert.match(config, /testMatch:\s*\/cross-browser-smoke\\\.spec\\\.mjs\//);
  assert.match(config, /retries:\s*process\.env\.CI\s*\?\s*1\s*:\s*0,/);
  for (const browser of ["firefox", "webkit"]) {
    assert.match(config, new RegExp("name:\\s*['\\\"]" + browser + "['\\\"]"));
  }
});

test("full-route cross-browser assertions and the 35-minute job budget remain unchanged", () => {
  for (const route of ["/", "/our-work", "/impact", "/donate", "/request-assistance", "/privacy"]) {
    assert.ok(smoke.includes("'"+route+"'"), "Route " + route + " must remain covered");
  }
  assert.match(smoke, /for \(const width of \[375, 1440\]\)/);
  assert.match(smoke, /getByRole\('link', \{ name: 'Skip to content' \}\)/);
  assert.match(workflow, /timeout-minutes: \$\{\{ needs\.plan\.outputs\.mode == 'full' && 35 \|\| 20 \}\}/);
  assert.match(workflow, /npx playwright test --config=playwright\.cross-browser\.config\.mjs/);
});
