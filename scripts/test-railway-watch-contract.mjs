import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

const policy = JSON.parse(readFileSync(new URL('../railway.json', import.meta.url), 'utf8'));
const shouldTrigger = [
  'src/app/page.tsx',
  'src/app/api/donations/order/route.ts',
  'src/lib/public-llms-index.ts',
  'src/components/site-header.tsx',
  'public/brand/amaana-mark.svg',
  'prisma/schema.prisma',
  'package.json',
  'package-lock.json',
  'next.config.ts',
  'tsconfig.json',
  'postcss.config.mjs',
  'Dockerfile',
  'railway.json',
];
const shouldSkip = [
  'src/lib/public-llms-index.test.ts',
  'src/components/card.test.tsx',
  'src/app/example.spec.ts',
  'src/app/nested/example.spec.tsx',
  'docs/RELEASE_STATUS.md',
  'e2e/public-seo.spec.mjs',
  'scripts/test-ci-plan.mjs',
  '.github/workflows/ci.yml',
];

test('Railway watch paths exclude isolated source tests without losing runtime changes', () => {
  const patterns = policy.build.watchPatterns;
  assert.ok(Array.isArray(patterns) && patterns.length > 0, 'Version-controlled watchPatterns must exist');
  const root = mkdtempSync(join(tmpdir(), 'amaana-watch-'));
  try {
    execFileSync('git', ['init', '-q'], { cwd: root });
    writeFileSync(join(root, '.gitignore'), patterns.join('\n') + '\n');
    for (const [expected, paths] of [[true, shouldTrigger], [false, shouldSkip]]) {
      for (const path of paths) {
        const filename = join(root, path);
        mkdirSync(dirname(filename), { recursive: true });
        writeFileSync(filename, 'fixture');
        let matched = false;
        try {
          execFileSync('git', ['check-ignore', '--no-index', '-q', path], { cwd: root });
          matched = true;
        } catch (error) {
          assert.equal(error.status, 1, 'git check-ignore failed unexpectedly for ' + path);
        }
        assert.equal(matched, expected, path + ' must ' + (expected ? 'trigger' : 'skip') + ' a deployment');
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Railway build and health configuration retain existing safety properties', () => {
  assert.equal(policy.build.builder, 'DOCKERFILE');
  assert.equal(policy.build.dockerfilePath, 'Dockerfile');
  assert.equal(policy.deploy.healthcheckPath, '/api/health/ready');
  assert.equal(policy.deploy.healthcheckTimeout, 300);
  assert.equal(policy.deploy.restartPolicyType, 'ON_FAILURE');
  assert.equal(policy.deploy.restartPolicyMaxRetries, 3);
});
