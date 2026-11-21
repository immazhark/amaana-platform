import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { classifyBranchRefs, collectLocalBranchRetention } from './branch-retention-report.mjs';

const shaA = 'a'.repeat(40);
const shaB = 'b'.repeat(40);
const shaC = 'c'.repeat(40);

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', timeout: 10_000 });
  assert.equal(r.status, 0, 'git ' + args[0] + ': ' + r.stderr);
  return r.stdout.trim();
}

function fixtureRepo() {
  const cwd = mkdtempSync(join(tmpdir(), 'amaana-branch-report-'));
  git(cwd, ['init', '-b', 'main']);
  git(cwd, ['config', 'user.name', 'Synthetic Test']);
  git(cwd, ['config', 'user.email', 'synthetic@example.invalid']);
  writeFileSync(join(cwd, 'README.md'), 'fixture\n');
  git(cwd, ['add', 'README.md']);
  git(cwd, ['commit', '-m', 'fixture base']);
  const first = git(cwd, ['rev-parse', 'HEAD']);
  git(cwd, ['switch', '-c', 'feature/contained']);
  writeFileSync(join(cwd, 'merged.txt'), 'contained\n');
  git(cwd, ['add', 'merged.txt']);
  git(cwd, ['commit', '-m', 'contained fixture']);
  const contained = git(cwd, ['rev-parse', 'HEAD']);
  git(cwd, ['switch', 'main']);
  git(cwd, ['merge', '--no-ff', '--no-edit', 'feature/contained']);
  const current = git(cwd, ['rev-parse', 'HEAD']);
  git(cwd, ['switch', '-c', 'feature/unmerged', first]);
  writeFileSync(join(cwd, 'unmerged.txt'), 'unmerged\n');
  git(cwd, ['add', 'unmerged.txt']);
  git(cwd, ['commit', '-m', 'unmerged fixture']);
  const unmerged = git(cwd, ['rev-parse', 'HEAD']);
  git(cwd, ['switch', 'main']);
  for (const [name, sha] of [['main', current], ['feature/contained', contained], ['feature/unmerged', unmerged]]) {
    git(cwd, ['update-ref', 'refs/remotes/origin/' + name, sha]);
  }
  return { cwd, current, contained, unmerged, first };
}

test('AF-R079 never labels a contained, open-PR, or protected ref as deletable', () => {
  const rows = classifyBranchRefs([
    { branch: 'main', sha: shaA, contained: true },
    { branch: 'fix/old', sha: shaB, contained: true },
    { branch: 'fix/open-pr', sha: shaB, contained: true },
    { branch: 'preserve/historical', sha: shaC, contained: false },
  ], shaA, { openPrBranches: ['fix/open-pr'] });
  assert.deepEqual(rows.map(x => x.disposition), [
    'REVIEW_MERGED_PR_STATUS_UNVERIFIED', 'PROTECT_OPEN_PR',
    'PROTECT_MAIN', 'PRESERVE_UNMERGED',
  ]);
  assert.ok(rows.every(x => !('delete' in x)));
});

test('AF-R079 refuses invalid or incomplete ref snapshots', () => {
  assert.throws(() => classifyBranchRefs([{ branch: 'main', sha: shaA, contained: true }, { branch: 'main', sha: shaB, contained: false }], shaA), /Duplicate/);
  assert.throws(() => classifyBranchRefs([{ branch: 'main', sha: shaA, contained: true }, { branch: 'partial', sha: 'bad', contained: false }], shaA), /SHA/);
  assert.throws(() => classifyBranchRefs([{ branch: 'fix/x', sha: shaB, contained: true }], shaA), /main/);
  assert.throws(() => classifyBranchRefs([{ branch: 'main', sha: shaA, contained: true }, { branch: 'fix/x', sha: shaB, contained: null }], shaA), /ancestry/);
  assert.throws(() => classifyBranchRefs([{ branch: 'main', sha: shaB, contained: true }], shaA), /main/);
});

test('AF-R079 inventories local remote refs without fetching or deleting any refs', () => {
  const f = fixtureRepo();
  try {
    const before = git(f.cwd, ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/remotes/origin']);
    const report = collectLocalBranchRetention(f.cwd);
    const after = git(f.cwd, ['for-each-ref', '--format=%(refname) %(objectname)', 'refs/remotes/origin']);
    assert.equal(after, before);
    assert.equal(report.mainSha, f.current);
    assert.equal(report.source, 'local-remote-refs-without-fetch');
    assert.deepEqual(report.counts, {
      protectedMain: 1, protectedOpenPr: 0, reviewMerged: 1, preservedUnmerged: 1,
    });
    assert.deepEqual(report.rows.map(x => [x.branch, x.disposition]), [
      ['feature/contained', 'REVIEW_MERGED_PR_STATUS_UNVERIFIED'],
      ['feature/unmerged', 'PRESERVE_UNMERGED'],
      ['main', 'PROTECT_MAIN'],
    ]);
    const cli = fileURLToPath(new URL('./branch-retention-report.mjs', import.meta.url));
    const result = spawnSync(process.execPath, [cli, '--json'], { cwd: f.cwd, encoding: 'utf8', timeout: 10_000 });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).mainSha, f.current);
    assert.doesNotMatch(result.stdout, /git push|delete branch/i);
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});

test('AF-R079 accepts a normal clone symbolic HEAD without changing refs', () => {
  const f = fixtureRepo();
  try {
    git(f.cwd, ['symbolic-ref', 'refs/remotes/origin/HEAD', 'refs/remotes/origin/main']);
    const before = git(f.cwd, ['for-each-ref', '--format=%(refname) %(objectname) %(symref)', 'refs/remotes/origin']);
    const report = collectLocalBranchRetention(f.cwd);
    assert.equal(report.rows.length, 3);
    assert.equal(report.rows.some(row => row.branch === 'HEAD'), false);
    assert.equal(report.mainSha, f.current);
    assert.equal(git(f.cwd, ['for-each-ref', '--format=%(refname) %(objectname) %(symref)', 'refs/remotes/origin']), before);
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});

test('AF-R079 fails closed without origin/main or with shallow ancestry', () => {
  const f = fixtureRepo();
  try {
    git(f.cwd, ['update-ref', '-d', 'refs/remotes/origin/main']);
    assert.throws(() => collectLocalBranchRetention(f.cwd), /origin\/main/);
    git(f.cwd, ['update-ref', 'refs/remotes/origin/main', f.current]);
    writeFileSync(join(f.cwd, '.git', 'shallow'), f.first + '\n');
    assert.throws(() => collectLocalBranchRetention(f.cwd), /shallow/);
  } finally { rmSync(f.cwd, { recursive: true, force: true }); }
});
