import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("superseded pull-request CI may cancel while production pushes are never cancelled", () => {
  const workflow = readFileSync(new URL("../.github/workflows/ci.yml", import.meta.url), "utf8");
  const concurrency = workflow.match(/^concurrency:\s*\n((?:^  [^\n]*\n)+)/m)?.[1] ?? "";
  assert.match(concurrency, /^  group: ci-\$\{\{ github\.workflow \}\}-\$\{\{ github\.ref \}\}/m);
  assert.match(concurrency, /^  cancel-in-progress: \$\{\{ github\.event_name == 'pull_request' \}\}$/m);
  assert.doesNotMatch(concurrency, /cancel-in-progress:\s*true\s*$/m,
    "Never cancel live branch deployment builds unconditionally.");
  assert.match(workflow, /^  push:\s*\n    branches:\s*\n      - main/m,
    "Keep production-branch CI verification active.");
});
