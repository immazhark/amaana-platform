import assert from "node:assert/strict";
import test from "node:test";
import { applyPurge, isSafeBranchName, planPurge } from "./purge-stale-branches.mjs";

const sha = char => char.repeat(40);
const base = {
  defaultBranch: "main",
  protectedNames: new Set(["protected/history"]),
  openPrBranches: new Set(["feat/open-pr", "release/base-of-open-pr"]),
  mergedNames: new Set(["fix/already-in-main"]),
  prHeadShas: new Set([sha("b")]),
};
const heads = [
  { name: "main", sha: sha("1") },
  { name: "protected/history", sha: sha("2") },
  { name: "feat/open-pr", sha: sha("3") },
  { name: "release/base-of-open-pr", sha: sha("4") },
  { name: "fix/already-in-main", sha: sha("5") },
  { name: "fix/pr-ref-preserved", sha: sha("b") },
  { name: "fix/unique-unreferenced", sha: sha("7") },
  { name: "bad..name", sha: sha("8") },
  { name: "fix/x.lock", sha: sha("9") },
  { name: "fix/bad-sha", sha: "not-a-sha" },
];

test("keeps the default, protected and open-PR branches and unsafe refs", () => {
  const { keep } = planPurge({ ...base, heads });
  assert.deepEqual(keep.map(item => [item.name, item.reason]), [
    ["main", "DEFAULT_BRANCH"],
    ["protected/history", "PROTECTED"],
    ["feat/open-pr", "OPEN_PR_HEAD_OR_BASE"],
    ["release/base-of-open-pr", "OPEN_PR_HEAD_OR_BASE"],
    ["bad..name", "UNSAFE_REF"],
    ["fix/x.lock", "UNSAFE_REF"],
    ["fix/bad-sha", "UNSAFE_REF"],
  ]);
});

test("removes merged and PR-preserved tips without archiving, unique tips with archiving", () => {
  const { remove } = planPurge({ ...base, heads });
  assert.deepEqual(remove, [
    { name: "fix/already-in-main", sha: sha("5"), archive: false },
    { name: "fix/pr-ref-preserved", sha: sha("b"), archive: false },
    { name: "fix/unique-unreferenced", sha: sha("7"), archive: true },
  ]);
});

test("accepts ordinary branch names and rejects traversal, lock and empty segments", () => {
  for (const ok of ["fix/a-b_c.1", "chore/x/y", "build/foundation-v1", "staging"]) assert.equal(isSafeBranchName(ok), true, ok);
  for (const bad of ["", "/lead", "trail/", "a//b", "a/../b", "a/./b", "x.lock", "a/x.lock/b", "-flag", "a b", "a~b", "a:b"]) {
    assert.equal(isSafeBranchName(bad), false, bad);
  }
});

test("archives unique tips before deleting and never deletes a branch whose archive failed", () => {
  const calls = [];
  const remove = [
    { name: "fix/one", sha: sha("a"), archive: false },
    { name: "fix/unique-ok", sha: sha("c"), archive: true },
    { name: "fix/unique-fails", sha: sha("d"), archive: true },
  ];
  const result = applyPurge({
    remove,
    archiveRef: entry => { calls.push("archive:" + entry.name); if (entry.name === "fix/unique-fails") throw new Error("refused"); },
    deleteBatch: batch => { calls.push("delete:" + batch.map(item => item.name).join(",")); },
  });
  assert.deepEqual(calls, ["archive:fix/unique-ok", "archive:fix/unique-fails", "delete:fix/one,fix/unique-ok"]);
  assert.deepEqual(result.deleted, ["fix/one", "fix/unique-ok"]);
  assert.deepEqual(result.failures, [{ name: "fix/unique-fails", step: "archive" }]);
});

test("deletes in bounded batches and retries a failed batch one branch at a time", () => {
  const remove = ["a", "b", "c", "d", "e"].map(name => ({ name: "fix/" + name, sha: sha("a"), archive: false }));
  const batches = [];
  const result = applyPurge({
    remove, chunk: 2, archiveRef: () => {},
    deleteBatch: batch => {
      batches.push(batch.map(item => item.name));
      if (batch.some(item => item.name === "fix/c")) throw new Error("refused");
    },
  });
  assert.deepEqual(batches, [["fix/a", "fix/b"], ["fix/c", "fix/d"], ["fix/c"], ["fix/d"], ["fix/e"]]);
  assert.deepEqual(result.deleted, ["fix/a", "fix/b", "fix/d", "fix/e"]);
  assert.deepEqual(result.failures, [{ name: "fix/c", step: "delete" }]);
});
