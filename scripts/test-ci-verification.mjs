import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Execute the actual workflow shell, not a separately implemented model of it.
const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
const verify = workflow.match(/^  verify:\n([\s\S]*?)(?=^  production-promotion-readiness:)/m)?.[1];
assert.ok(verify, "Missing CI verification job");
const command = verify.match(/^        run: \|\n((?:^ {10}[^\n]*\n)+)/m)?.[1];
assert.ok(command, "Missing CI verification shell");

const full = {
  PLAN: "success", FAST: "success", DATABASE: "success", PRODUCTION: "success", BROWSER: "success",
  APP_SELECTED: "true", DATABASE_SELECTED: "true", BROWSER_SELECTED: "true", EVENT_ACTION: "synchronize",
};
const none = {
  APP_SELECTED: "false", DATABASE_SELECTED: "false", BROWSER_SELECTED: "false",
  FAST: "skipped", DATABASE: "skipped", PRODUCTION: "skipped", BROWSER: "skipped",
};

function check(overrides, accepted) {
  const result = spawnSync("bash", ["-e", "-c", command], {
    env: { PATH: process.env.PATH, ...full, ...overrides }, encoding: "utf8",
  });
  assert.equal(result.error, undefined);
  assert.notEqual(result.status, null, "Verification shell did not exit normally");
  assert.equal(result.status === 0, accepted, result.stderr);
}

test("verification binds exact plan outputs and ready-state event", () => {
  for (const line of [
    'APP_SELECTED: ${{ needs.plan.outputs.app }}',
    'DATABASE_SELECTED: ${{ needs.plan.outputs.database }}',
    'BROWSER_SELECTED: ${{ needs.plan.outputs.browser }}',
    'EVENT_ACTION: ${{ github.event.action }}',
  ]) assert.ok(verify.includes(line), `Missing binding: ${line}`);
});

test("full acceptance requires all selected jobs to succeed", () => check({}, true));
for (const job of ["FAST", "DATABASE", "PRODUCTION", "BROWSER"]) {
  test(`selected ${job} cannot be skipped on a normal PR`, () => check({ [job]: "skipped" }, false));
}
test("selected database cannot be skipped on a main push", () => check({ EVENT_ACTION: "", DATABASE: "skipped" }, false));
test("documentation-only PR may skip unselected checks", () => check(none, true));
test("focused acceptance may skip the unselected database job", () => check({ DATABASE_SELECTED: "false", DATABASE: "skipped" }, true));
test("ready transition retains the intentional application-job skips", () => check({ EVENT_ACTION: "ready_for_review", FAST: "skipped", DATABASE: "skipped", PRODUCTION: "skipped", BROWSER: "skipped" }, true));
test("ready transition cannot hide a failed check", () => check({ EVENT_ACTION: "ready_for_review", DATABASE: "failure" }, false));
test("failed plan rejects even if every application job is skipped", () => check({ ...none, PLAN: "failure" }, false));
test("a failed unselected job is still a failure", () => check({ ...none, BROWSER: "failure" }, false));
test("cancelled selected job is rejected", () => check({ FAST: "cancelled" }, false));
test("unknown job result is rejected", () => check({ BROWSER: "unknown" }, false));
test("missing impact selection is rejected", () => check({ DATABASE_SELECTED: "" }, false));
test("invalid impact selection is rejected on ready transition too", () => check({ APP_SELECTED: "invalid", EVENT_ACTION: "ready_for_review" }, false));

import "./test-route-build-evidence.mjs";
import "./test-ui-audit-target.mjs";
import "./test-admin-workbench-donation-fixtures.mjs";
