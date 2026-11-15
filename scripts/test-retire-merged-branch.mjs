import assert from "node:assert/strict";
import test from "node:test";
import { planMergedBranchRetirement, retireMergedBranch } from "./retire-merged-branch.mjs";

const sha = char => char.repeat(40);
const makePr = (overrides = {}) => ({
  merged: true,
  head: { ref: "fix/af-r079-synthetic-fixture", sha: sha("a"),
    repo: { full_name: "immazhark/amaana-platform" } },
  base: { ref: "main", repo: { full_name: "immazhark/amaana-platform" } },
  merge_commit_sha: sha("b"),
  labels: [],
  ...overrides,
});
const snapshot = (overrides = {}) => ({
  event: { action: "closed", pull_request: makePr() },
  repository: "immazhark/amaana-platform",
  branch: { name: "fix/af-r079-synthetic-fixture", protected: false, commit: { sha: sha("a") } },
  compare: { status: "ahead", behind_by: 0 },
  otherOpenPrs: [],
  dependentBasePrs: [],
  ...overrides,
});

test("merged, unchanged, unprotected, same-repository task head may be retired", () => {
  assert.deepEqual(planMergedBranchRetirement(snapshot()), {
    action: "RETIRE", branch: "fix/af-r079-synthetic-fixture", expectedSha: sha("a"),
  });
});

test("never retires active, modified, reused, forked, or unmerged task branches", () => {
  const original = snapshot();
  for (const override of [
    { event: { action: "closed", pull_request: makePr({ merged: false }) } },
    { event: { action: "opened", pull_request: makePr() } },
    { branch: { ...original.branch, commit: { sha: sha("c") } } },
    { branch: { ...original.branch, protected: true } },
    { otherOpenPrs: [{ number: 1000 }] },
    { compare: { status: "diverged", behind_by: 1 } },
    { event: { action: "closed", pull_request: makePr({
      head: { ...makePr().head, repo: { full_name: "attacker/fork" } },
    }) } },
    { event: { action: "closed", pull_request: makePr({
      base: { ref: "staging", repo: { full_name: original.repository } },
    }) } },
    { event: { action: "closed", pull_request: makePr({
      labels: [{ name: "retain-branch" }],
    }) } },
  ]) assert.notEqual(planMergedBranchRetirement(snapshot(override)).action, "RETIRE");
});

test("preserves canonical and historical prefixes, and malformed names", () => {
  for (const name of ["main", "staging", "phase-public-site-rebuild",
    "release/november", "audit/historical", "ops/rollback", "infra/railway",
    "unknown-legacy", "fix/../unsafe", "fix/foo%bar"]) {
    const state = snapshot({
      branch: { ...snapshot().branch, name },
      event: { action: "closed", pull_request: makePr({
        head: { ...makePr().head, ref: name },
      }) },
    });
    assert.notEqual(planMergedBranchRetirement(state).action, "RETIRE", name);
  }
});

test("refuses incomplete or contradictory PR and branch snapshots", () => {
  for (const override of [
    { branch: null }, { compare: null }, { otherOpenPrs: null },
    { event: { action: "closed" } },
    { branch: { name: "fix/af-r079-synthetic-fixture", commit: { sha: "bad" } } },
  ]) assert.notEqual(planMergedBranchRetirement(snapshot(override)).action, "RETIRE");
});

test("executor rechecks exact branch SHA before retiring one eligible ref", async () => {
  const calls = [];
  const request = async (path, token, options = {}) => {
    assert.equal(token, "synthetic-token");
    calls.push({ path, method: options.method || "GET" });
    if (path.includes("/branches/")) return snapshot().branch;
    if (path.includes("/pulls?")) return [];
    if (path.includes("/compare/")) return snapshot().compare;
    if (options.method === "DELETE") return true;
    throw new Error("Unexpected endpoint");
  };
  const result = await retireMergedBranch({ ...snapshot(), token: "synthetic-token", request });
  assert.equal(result.action, "RETIRED");
  assert.equal(calls.filter(call => call.method === "DELETE").length, 1);
  assert.equal(calls.filter(call => call.path.includes("/branches/")).length, 2);
});

test("no delete occurs when ref changes between inspection and final recheck", async () => {
  let reads = 0;
  const methods = [];
  const request = async (path, token, options = {}) => {
    methods.push(options.method || "GET");
    if (path.includes("/branches/")) {
      reads += 1;
      return reads === 1 ? snapshot().branch :
        { ...snapshot().branch, commit: { sha: sha("c") } };
    }
    if (path.includes("/pulls?")) return [];
    if (path.includes("/compare/")) return snapshot().compare;
    throw new Error("Unsafe deletion attempted");
  };
  const result = await retireMergedBranch({ ...snapshot(), token: "synthetic-token", request });
  assert.equal(result.action, "PRESERVE");
  assert.equal(methods.includes("DELETE"), false);
});

test("no delete occurs for unmerged, explicitly retained, or fork-based PRs", async () => {
  for (const event of [
    { action: "closed", pull_request: makePr({ merged: false }) },
    { action: "closed", pull_request: makePr({
      labels: [{ name: "retain-branch" }],
    }) },
    { action: "closed", pull_request: makePr({
      head: { ...makePr().head, repo: { full_name: "someone/other" } },
    }) },
  ]) {
    const calls = [];
    const request = async (path, token, options = {}) => {
      calls.push(options.method || "GET");
      if (path.includes("/branches/")) return snapshot().branch;
      if (path.includes("/pulls?")) return [];
      if (path.includes("/compare/")) return snapshot().compare;
      throw new Error("Unexpected destructive request");
    };
    assert.equal((await retireMergedBranch({
      ...snapshot({ event }), token: "synthetic", request,
    })).action, "PRESERVE");
    assert.equal(calls.includes("DELETE"), false);
  }
});

test("never retires a task branch used as another open PR's base", () => {
  const result = planMergedBranchRetirement(snapshot({ dependentBasePrs: [{ number: 42 }] }));
  assert.notEqual(result.action, "RETIRE");
});
