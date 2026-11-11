#!/usr/bin/env node
/**
 * AF-R079: local-only branch containment inventory. This NEVER deletes branches,
 * fetches remote refs, or proposes that a branch is safe to delete. Even merged
 * refs need live PR-head, retention and owner review before any separate action.
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const commitSha = /^[a-f0-9]{40}$/;

export function classifyBranchRefs(refs, mainSha, { openPrBranches = [] } = {}) {
  if (!commitSha.test(mainSha)) throw new Error('A full main SHA is required');
  if (!Array.isArray(refs) || refs.length === 0) throw new Error('Local remote refs are missing');
  if (!Array.isArray(openPrBranches) || openPrBranches.some(name => typeof name !== 'string')) {
    throw new Error('Invalid open PR branch list');
  }
  const seen = new Set();
  for (const ref of refs) {
    if (!ref || typeof ref.branch !== 'string' || !ref.branch || /\s/.test(ref.branch)) {
      throw new Error('Invalid branch name');
    }
    if (seen.has(ref.branch)) throw new Error('Duplicate branch ref');
    seen.add(ref.branch);
    if (!commitSha.test(ref.sha)) throw new Error('Invalid branch SHA');
    if (typeof ref.contained !== 'boolean') throw new Error('Unverified branch ancestry');
  }
  const main = refs.find(ref => ref.branch === 'main');
  if (!main || main.sha !== mainSha || !main.contained) throw new Error('Local origin/main does not match the verified main SHA');
  const open = new Set(openPrBranches);
  return [...refs].sort((a, b) => a.branch.localeCompare(b.branch)).map(ref => ({
    branch: ref.branch,
    sha: ref.sha,
    containedInLocalMain: ref.contained,
    disposition: ref.branch === 'main' ? 'PROTECT_MAIN'
      : open.has(ref.branch) ? 'PROTECT_OPEN_PR'
      : ref.contained ? 'REVIEW_MERGED_PR_STATUS_UNVERIFIED'
      : 'PRESERVE_UNMERGED',
  }));
}

function git(cwd, args, { allowNotAncestor = false } = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 10_000, maxBuffer: 16_000_000 });
  if (result.error) throw new Error('Unable to inspect local git ' + args[0] + ' (no branch actions taken)');
  if (result.status !== 0 && !(allowNotAncestor && result.status === 1)) {
    throw new Error('Unable to inspect local git ' + args[0] + ' (status ' + result.status + '; no branch actions taken)');
  }
  return result;
}

export function collectLocalBranchRetention(cwd = process.cwd()) {
  const shallow = git(cwd, ['rev-parse', '--is-shallow-repository']).stdout.trim();
  if (shallow !== 'false') throw new Error('Refusing shallow or unverifiable Git ancestry');
  const mainRef = 'refs/remotes/origin/main';
  let main;
  try { main = git(cwd, ['rev-parse', '--verify', mainRef + '^{commit}']); }
  catch { throw new Error('Missing verified local origin/main; no branch actions taken'); }
  const mainSha = main.stdout.trim();
  const lines = git(cwd, ['for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/remotes/origin']).stdout.trim().split('\n').filter(Boolean);
  if (!lines.length) throw new Error('Local origin refs are missing');
  const refs = [];
  for (const line of lines) {
    const match = /^(origin\/\S+) ([a-f0-9]{40})$/.exec(line);
    if (!match) throw new Error('Unexpected remote ref format');
    const name = match[1].slice('origin/'.length);
    if (name === 'HEAD') continue; // Symbolic alias, not a branch.
    const containment = git(cwd, ['merge-base', '--is-ancestor', match[2], mainSha], { allowNotAncestor: true });
    refs.push({ branch: name, sha: match[2], contained: containment.status === 0 });
  }
  // No authoritative live PR-head inventory is available from local refs.
  // Even contained refs remain review-only, NEVER deletion-approved.
  const rows = classifyBranchRefs(refs, mainSha);
  const counts = {
    protectedMain: rows.filter(x => x.disposition === 'PROTECT_MAIN').length,
    protectedOpenPr: rows.filter(x => x.disposition === 'PROTECT_OPEN_PR').length,
    reviewMerged: rows.filter(x => x.disposition === 'REVIEW_MERGED_PR_STATUS_UNVERIFIED').length,
    preservedUnmerged: rows.filter(x => x.disposition === 'PRESERVE_UNMERGED').length,
  };
  return {
    source: 'local-remote-refs-without-fetch',
    snapshotWarning: 'Refs may be stale; open PR heads and retention approvals have not been checked. No branch is approved for deletion.',
    mainSha, counts, rows,
  };
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  if (process.argv.length !== 2 && !(process.argv.length === 3 && process.argv[2] === '--json')) {
    process.stderr.write('Only optional --json is accepted. This tool never changes refs.\n');
    process.exitCode = 2;
  } else {
    try {
      const report = collectLocalBranchRetention();
      if (process.argv.includes('--json')) process.stdout.write(JSON.stringify(report, null, 2) + '\n');
      else process.stdout.write('Local branch retention inventory: ' + JSON.stringify(report.counts) + '\n' + report.snapshotWarning + '\n');
    } catch (error) {
      process.stderr.write('Branch retention inventory aborted: ' + (error instanceof Error ? error.message : 'unknown error') + '\n');
      process.exitCode = 1;
    }
  }
}
