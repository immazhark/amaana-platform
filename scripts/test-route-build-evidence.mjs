import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const workflow = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
const production = workflow.match(/^  production:\n([\s\S]*?)(?=^  browser:)/m)?.[1] ?? '';
const capture = production.match(/^      - name: Capture exact-build route bundle evidence\n        shell: bash\n        run: \|\n((?:^ {10}[^\n]*\n)+)/m)?.[1];
const upload = production.match(/^      - name: Upload exact-build route bundle evidence\n([\s\S]*?)(?=^      - name:|(?![\s\S]))/m)?.[1] ?? '';

test('captures and uploads only scoped bundle evidence before the existing budget gate', () => {
  assert.ok(capture, 'Missing exact-build evidence capture');
  assert.match(capture, /set -euo pipefail/);
  assert.match(capture, /git rev-parse HEAD/);
  assert.match(capture, /node scripts\/report-route-bundles\.mjs --json --compressed/);
  assert.match(upload, /uses: actions\/upload-artifact@v7\.0\.2/);
  assert.match(upload, /name: route-bundle-evidence-\$\{\{ github\.sha \}\}-\$\{\{ github\.run_attempt \}\}/);
  assert.match(upload, /path: \|\n            \$\{\{ runner\.temp \}\}\/amaana-route-evidence\/report\.json\n            \$\{\{ runner\.temp \}\}\/amaana-route-evidence\/source-sha\.txt\n            \$\{\{ runner\.temp \}\}\/amaana-route-evidence\/node-version\.txt\n/);
  assert.match(upload, /if-no-files-found: error/);
  assert.match(upload, /retention-days: 7/);
  assert.doesNotMatch(upload, /(?:continue-on-error|if):/);
  assert.equal(upload.match(/^ {12}\$\{\{ runner\.temp \}\}\/amaana-route-evidence\//gm)?.length, 3);
  assert.ok(production.indexOf('Capture exact-build route bundle evidence') < production.indexOf('Upload exact-build route bundle evidence'));
  assert.ok(production.indexOf('Upload exact-build route bundle evidence') < production.indexOf('Enforce production bundle budgets'));
  assert.match(production, /JS_BUDGET=\$\(\(800 \* 1024\)\)/);
  assert.match(production, /CSS_BUDGET=\$\(\(356 \* 1024\)\)/);
});

test('runs the exact capture shell in isolation, preserves report and SHA, and fails on report errors', () => {
  assert.ok(capture, 'Missing exact-build evidence capture');
  const directory = mkdtempSync(join(tmpdir(), 'amaana-build-evidence-'));
  try {
    const repo = join(directory, 'repo'), temp = join(directory, 'runner');
    mkdirSync(join(repo, 'scripts'), { recursive: true });
    mkdirSync(temp);
    const git = args => spawnSync('git', args, { cwd: repo, encoding: 'utf8' });
    assert.equal(git(['init', '-q']).status, 0);
    assert.equal(git(['-c', 'user.name=CI fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '--allow-empty', '-qm', 'fixture']).status, 0);
    const sha = git(['rev-parse', 'HEAD']).stdout.trim();
    const sample = { metric: 'synthetic', jsRoutes: [{ route: '/', jsBytes: 123 }] };
    const reporter = join(repo, 'scripts/report-route-bundles.mjs');
    writeFileSync(reporter, "if (process.argv.slice(2).join(' ') !== '--json --compressed') process.exit(2); console.log(" + JSON.stringify(JSON.stringify(sample)) + " );\n");
    const run = () => spawnSync('bash', ['-c', capture], { cwd: repo, env: { PATH: process.env.PATH, RUNNER_TEMP: temp }, encoding: 'utf8' });
    const good = run();
    assert.equal(good.status, 0, good.stderr);
    const output = join(temp, 'amaana-route-evidence');
    assert.deepEqual(JSON.parse(readFileSync(join(output, 'report.json'), 'utf8')), sample);
    assert.equal(readFileSync(join(output, 'source-sha.txt'), 'utf8').trim(), sha);
    assert.match(readFileSync(join(output, 'node-version.txt'), 'utf8'), /^v\d+\./);
    writeFileSync(reporter, 'process.exit(7);\n');
    const bad = run();
    assert.equal(bad.status, 7);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
