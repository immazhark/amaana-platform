import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { retireApprovedHistory } from "./retire-approved-history.mjs";

const first = "a".repeat(40), second = "b".repeat(40);
const entries = [{ pr: 100, name: "fix/synthetic", headSha: first, mergeSha: second }];
const pr = {
  number: 100, merged: true, merged_at: "2026-11-15T00:00:00Z",
  head: { ref: "fix/synthetic", sha: first, repo: { full_name: "immazhark/amaana-platform" } },
  base: { ref: "main", repo: { full_name: "immazhark/amaana-platform" } },
  merge_commit_sha: second, labels: [],
};

test("exact historical PR, branch and merge evidence retires one reviewed ref", async () => {
  const calls = [];
  const request = async (path, token, opts = {}) => {
    calls.push([path, opts.method || "GET"]);
    if (path.endsWith("/pulls/100")) return pr;
    if (path.includes("/branches/")) return { name: "fix/synthetic",
      commit: { sha: first }, protected: false };
    if (path.includes("/pulls?")) return [];
    if (path.includes("/compare/")) return { behind_by: 0, status: "ahead" };
    if (opts.method === "DELETE") return true;
    throw new Error("Unexpected request");
  };
  const result = await retireApprovedHistory({
    entries, repository: "immazhark/amaana-platform", token: "synthetic", request,
  });
  assert.equal(result[0].action, "RETIRED");
  assert.equal(calls.filter(x => x[1] === "DELETE").length, 1);
});

test("mismatched historical PR source head is preserved without deleting any ref", async () => {
  const calls = [];
  const request = async (path, token, opts = {}) => {
    calls.push(opts.method || "GET");
    return { ...pr, head: { ...pr.head, sha: "c".repeat(40) } };
  };
  const result = await retireApprovedHistory({
    entries, repository: "immazhark/amaana-platform", token: "synthetic", request,
  });
  assert.equal(result[0].action, "PRESERVE");
  assert.equal(calls.includes("DELETE"), false);
});

test("duplicate, malformed, or unbounded history batches fail before any network action", async () => {
  for (const candidate of [
    [], [...entries, ...entries], Array(26).fill(entries[0]),
    [{ ...entries[0], name: "main" }],
  ]) {
    await assert.rejects(retireApprovedHistory({
      entries: candidate, repository: "immazhark/amaana-platform",
      token: "synthetic", request: () => { throw new Error("Network must not be used"); },
    }));
  }
});

test("AF-R079 checked-in retirement manifest passes the exact CLI guard before dispatch", async () => {
  // A manifest can pass synthetic guard tests yet fail the live retirement
  // workflow if it contains a non-allowlisted category such as content/.
  const entries = JSON.parse(readFileSync(new URL(
    "../docs/mission-control/af-r079-approved-retirement-batch-20261115.json", import.meta.url,
  ), "utf8"));
  let requests = 0;
  const outcomes = await retireApprovedHistory({
    entries, repository: "immazhark/amaana-platform", token: "synthetic",
    request: async () => {
      requests += 1;
      return { merged: false };
    },
  });
  assert.equal(requests, entries.length, "Every syntactically valid manifest entry should be reviewed");
  assert.equal(outcomes.length, entries.length);
  assert.ok(outcomes.every(outcome =>
    outcome.action === "PRESERVE" && outcome.reason === "MANIFEST_PR_MISMATCH"));
});
