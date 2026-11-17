#!/usr/bin/env node
/**
 * One-off repository sanitization. Deletes every remote branch that is safe to
 * lose: its tip is already in the default branch, or a pull request ref
 * (refs/pull/N/head) preserves it, or it carries unique commits that are first
 * parked under refs/archive/ so nothing becomes unrecoverable.
 *
 * Never touches the default branch, protected branches, or any branch an open
 * pull request uses as head or base. Dry run unless PURGE_APPLY=true. Every
 * delete is pinned to the exact SHA that was planned.
 */
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { githubRequest } from "./retire-merged-branch.mjs";

const shaPattern = /^[a-f0-9]{40}$/;
const namePattern = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;

export function isSafeBranchName(name) {
  return typeof name === "string" && name.length <= 200 && namePattern.test(name) && !name.includes("..") &&
    name.split("/").every(part => part && part !== "." && part !== ".." && !part.endsWith(".lock"));
}

/** Pure, fail-closed plan. No network or git side effects. */
export function planPurge({ heads, prHeadShas, mergedNames, protectedNames, openPrBranches, defaultBranch }) {
  const remove = [];
  const keep = [];
  for (const { name, sha } of heads) {
    if (name === defaultBranch) keep.push({ name, reason: "DEFAULT_BRANCH" });
    else if (!isSafeBranchName(name) || !shaPattern.test(sha)) keep.push({ name, reason: "UNSAFE_REF" });
    else if (protectedNames.has(name)) keep.push({ name, reason: "PROTECTED" });
    else if (openPrBranches.has(name)) keep.push({ name, reason: "OPEN_PR_HEAD_OR_BASE" });
    else if (mergedNames.has(name) || prHeadShas.has(sha)) remove.push({ name, sha, archive: false });
    else remove.push({ name, sha, archive: true });
  }
  return { remove, keep };
}

/** Archive unique tips first; delete in bounded batches; retry a failed batch per branch. */
export function applyPurge({ remove, archiveRef, deleteBatch, chunk = 40 }) {
  const deletable = [];
  const failures = [];
  for (const entry of remove) {
    if (!entry.archive) { deletable.push(entry); continue; }
    try { archiveRef(entry); deletable.push(entry); } catch { failures.push({ name: entry.name, step: "archive" }); }
  }
  const deleted = [];
  for (let index = 0; index < deletable.length; index += chunk) {
    const batch = deletable.slice(index, index + chunk);
    try {
      deleteBatch(batch);
      deleted.push(...batch.map(entry => entry.name));
    } catch {
      for (const entry of batch) {
        try { deleteBatch([entry]); deleted.push(entry.name); } catch { failures.push({ name: entry.name, step: "delete" }); }
      }
    }
  }
  return { deleted, failures };
}

async function pages(path, token) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const rows = await githubRequest(`${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`, token);
    if (!Array.isArray(rows) || rows.length === 0) return all;
    all.push(...rows);
    if (rows.length < 100) return all;
  }
}

function makeGit(token) {
  const header = "AUTHORIZATION: basic " + Buffer.from("x-access-token:" + token).toString("base64");
  return args => execFileSync("git", ["-c", "http.https://github.com/.extraheader=" + header, ...args],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 256 * 1024 * 1024 });
}

const lines = text => text.split("\n").filter(Boolean).map(line => line.split(/\s+/));

async function main() {
  const repository = process.env.GITHUB_REPOSITORY;
  const token = process.env.GITHUB_TOKEN;
  if (!repositoryPattern.test(repository ?? "") || !token) throw new Error("Repository identity or token missing");
  const apply = process.env.PURGE_APPLY === "true";
  const git = makeGit(token);

  const { default_branch: defaultBranch } = await githubRequest(`/repos/${repository}`, token);
  const heads = lines(git(["ls-remote", "--heads", "origin"])).map(([sha, ref]) => ({ sha, name: ref.replace(/^refs\/heads\//, "") }));
  const prHeadShas = new Set(lines(git(["ls-remote", "origin", "refs/pull/*/head"])).map(([sha]) => sha));
  git(["fetch", "--no-tags", "--quiet", "origin", "+refs/heads/*:refs/remotes/origin/*"]);
  const mergedNames = new Set(git(["branch", "-r", "--merged", "origin/" + defaultBranch, "--format=%(refname:short)"])
    .split("\n").filter(Boolean).map(name => name.replace(/^origin\//, "")));
  const protectedNames = new Set((await pages(`/repos/${repository}/branches?protected=true`, token)).map(branch => branch.name));
  const openPrBranches = new Set();
  for (const pr of await pages(`/repos/${repository}/pulls?state=open`, token)) {
    openPrBranches.add(pr.base.ref);
    if (pr.head.repo?.full_name === repository) openPrBranches.add(pr.head.ref);
  }

  const { remove, keep } = planPurge({ heads, prHeadShas, mergedNames, protectedNames, openPrBranches, defaultBranch });
  const summary = {
    mode: apply ? "APPLY" : "DRY_RUN", heads: heads.length, keep: keep.length, remove: remove.length,
    removeMergedOrPrPreserved: remove.filter(entry => !entry.archive).length,
    removeAfterArchive: remove.filter(entry => entry.archive).length,
    kept: keep,
  };
  if (!apply) { process.stdout.write(JSON.stringify(summary, null, 1) + "\n"); return; }

  const result = applyPurge({
    remove,
    archiveRef: entry => git(["push", "origin", `${entry.sha}:refs/archive/${entry.name}`]),
    deleteBatch: batch => git(["push", "origin",
      ...batch.map(entry => `--force-with-lease=refs/heads/${entry.name}:${entry.sha}`),
      ...batch.map(entry => `:refs/heads/${entry.name}`)]),
  });
  process.stdout.write(JSON.stringify({ ...summary, deleted: result.deleted.length, failures: result.failures }, null, 1) + "\n");
  if (result.failures.length) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  main().catch(error => {
    process.stderr.write("Branch purge halted: " + (error instanceof Error ? error.message : "unknown error") + "\n");
    process.exitCode = 1;
  });
}
