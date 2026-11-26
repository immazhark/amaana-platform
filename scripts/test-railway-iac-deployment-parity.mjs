import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compareDeploymentParity } from './railway-iac-deployment-parity.mjs';

const baseline = JSON.parse(readFileSync(new URL('./railway-iac-observed-2026-11-26.json', import.meta.url), 'utf8'));
// Hypothetical complete deployment-manifest evidence; not an observed manifest.
const evidence = {
  deploymentId: '9ba5a33f-0797-41bd-84fb-e8f2e484ac56',
  commitSha: '04f691336ea62e59fe35562dec6465a1e094b18b',
  builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile', healthcheckPath: '/api/health/ready',
  healthcheckTimeout: 300, restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 3,
};
const runtimeIdentity = {
  deploymentId: evidence.deploymentId, commitSha: evidence.commitSha, runtimeCommitSha: evidence.commitSha,
  status: 'SUCCESS', environment: 'production', branch: 'main',
};
const compare = (manifest, candidate) => compareDeploymentParity(manifest, candidate, runtimeIdentity);
const target = () => {
  const value = structuredClone(baseline);
  Object.assign(value.website, { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile',
    healthcheckTimeout: 300, restartPolicyType: 'ON_FAILURE', preDeployTimeoutSeconds: 300 });
  return value;
};

test('deployment parity refuses stored fallback even with complete synthetic manifest evidence', () => {
  const issues = compare(evidence, baseline);
  assert.ok(issues.some(issue => issue.code === 'website.builder'));
  assert.ok(issues.some(issue => issue.code === 'website.healthcheckTimeout'));
});
test('requires complete evidence for the exact reviewed successful deployment', () => {
  for (const incomplete of [null, {}, { ...evidence, healthcheckTimeout: null },
    { ...evidence, restartPolicyType: undefined }, { ...evidence, commitSha: '0'.repeat(40) },
    { ...evidence, deploymentId: 'another-deployment' }, { ...evidence, builder: 'RAILPACK' }]) {
    assert.deepEqual(compare(incomplete, target()).map(issue => issue.code), ['deployment-evidence']);
  }
});
test('accepts complete synthetic manifest and normalized parity target, not a live plan', () => {
  assert.deepEqual(compare(evidence, target()), []);
});
test('rejects drift in new effective fields and retained auxiliary boundaries', () => {
  for (const [field, replacement] of [['dockerfilePath', 'OtherDockerfile'], ['restartPolicyType', 'NEVER'], ['preDeployTimeoutSeconds', 90]]) {
    const candidate = target(); candidate.website[field] = replacement;
    assert.ok(compare(evidence, candidate).some(issue => issue.code === 'website.' + field));
  }
  const worker = target(); worker.auxiliaryServices[0].cronSchedule = '0 0 1 1 *';
  assert.ok(compare(evidence, worker).some(issue => issue.code === 'auxiliary.amaana-notification-cron.cronSchedule'));
  const removed = target(); removed.bucketCount--;
  assert.ok(compare(evidence, removed).some(issue => issue.code === 'bucket-inventory'));
});
test('does not echo unknown secret-bearing keys or values', () => {
  const candidate = target(); candidate['synthetic-secret-key'] = 'synthetic-secret-value';
  candidate.website['synthetic-secret-other'] = 'synthetic-secret-extra';
  candidate.auxiliaryServices[0]['synthetic-secret-worker'] = 'synthetic-secret-worker-value';
  const issues = compare(evidence, candidate);
  assert.ok(issues.length > 0);
  assert.doesNotMatch(JSON.stringify(issues), /synthetic-secret/);
});

test('refuses the superseded deployment even if all other hypothetical settings match', () => {
  const superseded = { ...evidence, deploymentId: '9d84359f-60d8-479a-be8a-ebc6c85ebfab', commitSha: '7619d3335f5a710ee5ffa044e475ebbd2b36103a' };
  assert.deepEqual(compare(superseded, target()).map(issue => issue.code), ['deployment-evidence']);
});
test('current Dockerfile evidence alone does not prove effective readiness or restart settings', () => {
  const incomplete = { ...evidence, healthcheckTimeout: null, restartPolicyType: null };
  const storedFallback = { ...evidence, builder: 'RAILPACK', healthcheckTimeout: 90 };
  for (const observed of [incomplete, storedFallback]) {
    assert.deepEqual(compare(observed, target()).map(issue => issue.code), ['deployment-evidence']);
  }
});

test('fresh independently reviewed runtime identity replaces a stale source pin without code changes', () => {
  const current = { deploymentId: '37f86979-63e0-4041-985a-c77a6a275852', commitSha: '3aa68b9fe2508456eec13b7a2082da6a78c52d25' };
  const reference = { ...runtimeIdentity, ...current, runtimeCommitSha: current.commitSha };
  const manifest = { ...evidence, ...current };
  assert.deepEqual(compareDeploymentParity(manifest, target(), reference), []);
  assert.deepEqual(compareDeploymentParity(evidence, target(), reference).map(issue => issue.code), ['deployment-evidence']);
  assert.deepEqual(compareDeploymentParity({ ...manifest, healthcheckTimeout: null }, target(), reference).map(issue => issue.code), ['deployment-evidence']);
});
test('rejects absent, mismatched or malformed current-runtime evidence without disclosing input', () => {
  for (const reference of [undefined, null, { ...runtimeIdentity, runtimeCommitSha: '0'.repeat(40) }, { ...runtimeIdentity, status: 'BUILDING' }, { ...runtimeIdentity, environment: 'staging' }, { ...runtimeIdentity, branch: 'feature' }, { ...runtimeIdentity, deploymentId: 'not-a-uuid' }, { ...runtimeIdentity, commitSha: 'not-a-sha', runtimeCommitSha: 'not-a-sha' }, { ...runtimeIdentity, 'private-synthetic-key': 'private-synthetic-value' }]) {
    const issues = compareDeploymentParity(evidence, target(), reference);
    assert.deepEqual(issues.map(issue => issue.code), ['runtime-identity']);
    assert.doesNotMatch(JSON.stringify(issues), /private-synthetic/);
  }
});
