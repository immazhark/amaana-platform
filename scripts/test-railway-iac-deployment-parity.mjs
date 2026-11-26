import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compareDeploymentParity } from './railway-iac-deployment-parity.mjs';

const baseline = JSON.parse(readFileSync(new URL('./railway-iac-observed-2026-11-26.json', import.meta.url), 'utf8'));
// Hypothetical complete deployment-manifest evidence; not an observed manifest.
const evidence = {
  deploymentId: '9d84359f-60d8-479a-be8a-ebc6c85ebfab',
  commitSha: '7619d3335f5a710ee5ffa044e475ebbd2b36103a',
  builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile', healthcheckPath: '/api/health/ready',
  healthcheckTimeout: 300, restartPolicyType: 'ON_FAILURE', restartPolicyMaxRetries: 3,
};
const target = () => {
  const value = structuredClone(baseline);
  Object.assign(value.website, { builder: 'DOCKERFILE', dockerfilePath: 'Dockerfile',
    healthcheckTimeout: 300, restartPolicyType: 'ON_FAILURE', preDeployTimeoutSeconds: 300 });
  return value;
};

test('deployment parity refuses stored fallback even with complete synthetic manifest evidence', () => {
  const issues = compareDeploymentParity(evidence, baseline);
  assert.ok(issues.some(issue => issue.code === 'website.builder'));
  assert.ok(issues.some(issue => issue.code === 'website.healthcheckTimeout'));
});
test('requires complete evidence for the exact reviewed successful deployment', () => {
  for (const incomplete of [null, {}, { ...evidence, healthcheckTimeout: null },
    { ...evidence, restartPolicyType: undefined }, { ...evidence, commitSha: '0'.repeat(40) },
    { ...evidence, deploymentId: 'another-deployment' }, { ...evidence, builder: 'RAILPACK' }]) {
    assert.deepEqual(compareDeploymentParity(incomplete, target()).map(issue => issue.code), ['deployment-evidence']);
  }
});
test('accepts complete synthetic manifest and normalized parity target, not a live plan', () => {
  assert.deepEqual(compareDeploymentParity(evidence, target()), []);
});
test('rejects drift in new effective fields and retained auxiliary boundaries', () => {
  for (const [field, replacement] of [['dockerfilePath', 'OtherDockerfile'], ['restartPolicyType', 'NEVER'], ['preDeployTimeoutSeconds', 90]]) {
    const candidate = target(); candidate.website[field] = replacement;
    assert.ok(compareDeploymentParity(evidence, candidate).some(issue => issue.code === 'website.' + field));
  }
  const worker = target(); worker.auxiliaryServices[0].cronSchedule = '0 0 1 1 *';
  assert.ok(compareDeploymentParity(evidence, worker).some(issue => issue.code === 'auxiliary.amaana-notification-cron.cronSchedule'));
  const removed = target(); removed.bucketCount--;
  assert.ok(compareDeploymentParity(evidence, removed).some(issue => issue.code === 'bucket-inventory'));
});
test('does not echo unknown secret-bearing keys or values', () => {
  const candidate = target(); candidate['synthetic-secret-key'] = 'synthetic-secret-value';
  candidate.website['synthetic-secret-other'] = 'synthetic-secret-extra';
  candidate.auxiliaryServices[0]['synthetic-secret-worker'] = 'synthetic-secret-worker-value';
  const issues = compareDeploymentParity(evidence, candidate);
  assert.ok(issues.length > 0);
  assert.doesNotMatch(JSON.stringify(issues), /synthetic-secret/);
});
