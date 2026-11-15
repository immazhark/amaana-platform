#!/usr/bin/env node
/** AF-R079: explicitly pinned, verified historical retirement batch. */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { githubRequest, retireMergedBranch } from "./retire-merged-branch.mjs";

const sha = /^[a-f0-9]{40}$/;
const names = /^(?:fix|feat|perf|test|docs|chore)\/[A-Za-z0-9][A-Za-z0-9._/-]*$/;

export async function retireApprovedHistory({ entries, repository, token, request = githubRequest } = {}) {
  if (!Array.isArray(entries) || entries.length < 1 || entries.length > 25 ||
      !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? "") ||
      typeof token !== "string" || !token) throw new Error("Invalid historic retirement context");
  const ids = new Set(), refs = new Set();
  for (const entry of entries) {
    if (!entry || !Number.isSafeInteger(entry.pr) || entry.pr <= 0 ||
        typeof entry.name !== "string" || !names.test(entry.name) ||
        entry.name.split("/").some(part => !part || part === "." || part === ".." || part.endsWith(".lock")) ||
        !sha.test(entry.headSha ?? "") || !sha.test(entry.mergeSha ?? "") ||
        ids.has(entry.pr) || refs.has(entry.name)) throw new Error("Invalid or duplicate retention manifest entry");
    ids.add(entry.pr); refs.add(entry.name);
  }
  const results = [];
  for (const entry of entries) {
    const pr = await request("/repos/" + repository + "/pulls/" + entry.pr, token);
    const matches = pr?.merged === true && typeof pr?.merged_at === "string" &&
      pr.head?.ref === entry.name && pr.head?.sha === entry.headSha &&
      pr.merge_commit_sha === entry.mergeSha && pr.head?.repo?.full_name === repository &&
      pr.base?.repo?.full_name === repository && pr.base?.ref === "main";
    if (!matches) {
      results.push({ branch: entry.name, action: "PRESERVE", reason: "MANIFEST_PR_MISMATCH" });
      continue;
    }
    const outcome = await retireMergedBranch({
      event: { action: "closed", pull_request: pr }, repository, token, request,
    });
    results.push({ branch: entry.name, ...outcome });
  }
  return results;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2) {
    process.stderr.write("No arbitrary deletion arguments are permitted.\n");
    process.exitCode = 2;
  } else {
    try {
      if (process.env.GITHUB_REPOSITORY !== "immazhark/amaana-platform" || !process.env.GITHUB_TOKEN) {
        throw new Error("Reviewed repository identity or token missing");
      }
      const file = new URL("../docs/mission-control/af-r079-approved-retirement-batch-20261115.json", import.meta.url);
      const entries = JSON.parse(await readFile(file, "utf8"));
      const outcomes = await retireApprovedHistory({
        entries, repository: process.env.GITHUB_REPOSITORY, token: process.env.GITHUB_TOKEN,
      });
      process.stdout.write(JSON.stringify(outcomes, null, 2) + "\n");
    } catch (error) {
      process.stderr.write("Historical retirement halted: " +
        (error instanceof Error ? error.message : "unknown error") + "\n");
      process.exitCode = 1;
    }
  }
}
