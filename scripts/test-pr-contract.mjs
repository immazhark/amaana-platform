import { test } from "node:test";
import assert from "node:assert/strict";
import { validatePrContract } from "./check-pr-contract.mjs";

const body = `## Purpose
Deliver one private, noncharging monthly reminder.

## Acceptance criteria
- [ ] A visitor can choose the last day of each month.
- [ ] Date selection never creates payment instructions.

## Verification
- [ ] Unit and API tests.
- [ ] Production build, database and browser checks.

## Release plan
Deploy only after exact-head checks pass. Roll back by reverting this PR.
`;

function change(overrides = {}) {
  return {
    title: "feat: private calendar reminder",
    branch: "feat/private-calendar-reminder-20261017",
    base: "main",
    body,
    files: ["src/lib/giving-calendar.ts", "src/lib/giving-calendar.test.ts"],
    ...overrides,
  };
}

test("allows a coherent PR with a specific release contract", () => {
  assert.deepEqual(validatePrContract(change()), []);
});

test("requires a task branch and conventional scoped title", () => {
  assert.match(validatePrContract(change({ title: "changes" })).join(" "), /title/i);
  assert.match(validatePrContract(change({ branch: "main" })).join(" "), /branch/i);
  assert.match(validatePrContract(change({ branch: "feature/Many_Things" })).join(" "), /branch/i);
  assert.deepEqual(validatePrContract(change({ branch: "fix/donation-amount-20261017", title: "fix: prevent duplicate donor submission" })), []);
});

test("requires all delivery and release sections, never accepts an empty template", () => {
  for (const section of ["Purpose", "Acceptance criteria", "Verification", "Release plan"]) {
    const changed = body.replace(new RegExp(`## ${section}[\\s\\S]*?(?=\\n## |$)`), `## ${section}\\n\\n`);
    assert.match(validatePrContract(change({ body: changed })).join(" "), new RegExp(section, "i"));
  }
  assert.match(validatePrContract(change({ body: "## Purpose\\nTODO" })).join(" "), /Acceptance criteria/i);
  assert.match(validatePrContract(change({ body: body.replace("- [ ] A visitor", "A visitor").replace("- [ ] Date", "Date") })).join(" "), /checklist/i);
});

test("flags oversized change sets unless the PR documents why one feature requires them", () => {
  const files = Array.from({ length: 26 }, (_, i) => `src/features/giving/part-${i}.ts`);
  assert.match(validatePrContract(change({ files })).join(" "), /scope/i);
  assert.deepEqual(validatePrContract(change({
    files,
    body: body + `\n## Scope rationale\nAll 26 files belong to the same single feature; the extra files are its isolated translations and tests.\n`,
  })), []);
  assert.match(validatePrContract(change({
    files, body: body + "\n## Scope rationale\nToo big.\n",
  })).join(" "), /scope/i);
});

test("rejects empty changes, mixed unrelated areas require reviewer confirmation", () => {
  assert.match(validatePrContract(change({ files: [] })).join(" "), /changed files/i);
  assert.deepEqual(validatePrContract(change({
    title: "docs: document PR conventions",
    branch: "docs/pr-conventions",
    files: ["CONTRIBUTING.md"],
  })), []);
});

test("never accepts invalid PR metadata or non-string descriptions", () => {
  assert.match(validatePrContract(null).join(" "), /metadata/i);
  assert.match(validatePrContract(change({ body: null })).join(" "), /Purpose/i);
  assert.match(validatePrContract(change({ files: "not-files" })).join(" "), /changed files/i);
});
