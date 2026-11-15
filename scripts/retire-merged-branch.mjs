#!/usr/bin/env node
/**
 * AF-R079: retire only a verified, same-repository task-branch head after its
 * completed PR was merged into protected main. Never touch historical refs.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const shaPattern = /^[a-f0-9]{40}$/;
const repositoryPattern = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const taskBranchPattern = /^(?:fix|feat|perf|test|docs|chore|refactor|ui|polish|content|build|ci|qa)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const preserve = reason => ({ action: "PRESERVE", reason });

function validTaskBranch(name) {
  return typeof name === "string" && name.length <= 180 && taskBranchPattern.test(name) &&
    name.split("/").every(segment => segment && segment !== "." && segment !== ".." &&
      !segment.endsWith(".lock"));
}

/** Pure fail-closed decision, without GitHub/network side effects. */
export function planMergedBranchRetirement({ event, repository, branch, compare, otherOpenPrs } = {}) {
  const pr = event?.pull_request;
  if (event?.action !== "closed" || pr?.merged !== true) return preserve("NOT_MERGED");
  if (!repositoryPattern.test(repository ?? "") || pr?.head?.repo?.full_name !== repository ||
      pr?.base?.repo?.full_name !== repository || pr?.base?.ref !== "main") {
    return preserve("WRONG_REPOSITORY_OR_BASE");
  }
  const name = pr?.head?.ref;
  if (!validTaskBranch(name) || !shaPattern.test(pr?.head?.sha ?? "") ||
      !shaPattern.test(pr?.merge_commit_sha ?? "")) return preserve("UNREVIEWED_REF");
  if (pr.labels?.some(label => label?.name?.toLowerCase() === "retain-branch")) {
    return preserve("EXPLICIT_RETENTION");
  }
  if (!branch || branch.name !== name || branch.protected !== false ||
      branch.commit?.sha !== pr.head.sha) return preserve("BRANCH_MISSING_CHANGED_OR_PROTECTED");
  if (!Array.isArray(otherOpenPrs) || otherOpenPrs.length !== 0) {
    return preserve("DEPENDENT_PR_OR_UNVERIFIED");
  }
  if (!compare || compare.behind_by !== 0 || !["ahead", "identical"].includes(compare.status)) {
    return preserve("MERGE_COMMIT_NOT_VERIFIED_IN_MAIN");
  }
  return { action: "RETIRE", branch: name, expectedSha: pr.head.sha };
}

const encodedBranch = name => name.split("/").map(encodeURIComponent).join("/");

/** Fail closed, never print tokens, response bodies, or private API payloads. */
async function githubRequest(path, token, { method = "GET", absentIsNull = false } = {}) {
  const response = await fetch("https://api.github.com" + path, {
    method,
    headers: { authorization: "Bearer " + token, accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28" },
    signal: AbortSignal.timeout(15_000),
    redirect: "error",
  });
  if (absentIsNull && response.status === 404) return null;
  if (method === "DELETE" && response.status === 204) return true;
  if (!response.ok) throw new Error("GitHub branch operation refused (HTTP " + response.status + ")");
  return response.json();
}

export async function retireMergedBranch({ event, repository, token, request = githubRequest } = {}) {
  const pr = event?.pull_request;
  if (event?.action !== "closed" || pr?.merged !== true) return preserve("NOT_MERGED");
  if (typeof token !== "string" || !token || !repositoryPattern.test(repository ?? "")) {
    throw new Error("Required GitHub repository credentials are unavailable");
  }
  if (pr.head?.repo?.full_name !== repository || pr.base?.repo?.full_name !== repository ||
      pr.base?.ref !== "main" || !validTaskBranch(pr.head?.ref)) {
    return preserve("UNREVIEWED_REF_OR_BASE");
  }
  const base = "/repos/" + repository;
  const ref = encodedBranch(pr.head.ref);
  const branch = await request(base + "/branches/" + ref, token, { absentIsNull: true });
  if (!branch) return preserve("ALREADY_REMOVED");
  const openPrs = await request(base + "/pulls?state=open&head=" +
    encodeURIComponent(repository.split("/")[0] + ":" + pr.head.ref) + "&per_page=100", token);
  const compare = shaPattern.test(pr.merge_commit_sha ?? "") ? await request(base + "/compare/" +
    pr.merge_commit_sha + "...main", token) : null;
  const plan = planMergedBranchRetirement({ event, repository, branch, compare, otherOpenPrs: openPrs });
  if (plan.action !== "RETIRE") return plan;

  // REST delete-ref has no atomic expected-SHA lease. Re-read immediately;
  // fail closed on any change and never retry a failed destructive action.
  const latest = await request(base + "/branches/" + ref, token, { absentIsNull: true });
  if (!latest || latest.protected !== false || latest.commit?.sha !== plan.expectedSha) {
    return preserve("BRANCH_CHANGED_DURING_RECHECK");
  }
  await request(base + "/git/refs/heads/" + ref, token, { method: "DELETE" });
  return { action: "RETIRED", branch: plan.branch, sha: plan.expectedSha };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) {
    process.stderr.write("No arbitrary branch arguments are permitted.\n");
    process.exitCode = 2;
  } else {
    try {
      const file = process.env.GITHUB_EVENT_PATH;
      if (!file || !process.env.GITHUB_REPOSITORY || !process.env.GITHUB_TOKEN) {
        throw new Error("GitHub event context is required");
      }
      const event = JSON.parse(await readFile(file, "utf8"));
      const result = await retireMergedBranch({ event, repository: process.env.GITHUB_REPOSITORY,
        token: process.env.GITHUB_TOKEN });
      process.stdout.write("AF-R079 branch retirement: " + JSON.stringify(result) + "\n");
    } catch (error) {
      process.stderr.write("AF-R079 branch retirement blocked: " +
        (error instanceof Error ? error.message : "unknown error") + "\n");
      process.exitCode = 1;
    }
  }
}
