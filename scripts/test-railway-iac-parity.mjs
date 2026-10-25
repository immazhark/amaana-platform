import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { compareMigrationInventory } from './railway-iac-parity.mjs';

const reference = JSON.parse(readFileSync(new URL('./railway-iac-observed-2026-10-25.json', import.meta.url), 'utf8'));
const clone = () => structuredClone(reference);
const hasIssue = (candidate, code) => compareMigrationInventory(reference, candidate).some(issue => issue.code === code);

test('exact observed inventory clears the non-secret parity preflight', () => {
  assert.deepEqual(compareMigrationInventory(reference, clone()), []);
});
test('rejects a removed live service or duplicate service reference', () => {
  const omitted = clone(); omitted.serviceNames.pop();
  assert.equal(hasIssue(omitted, 'service-inventory'), true);
  const duplicate = clone(); duplicate.serviceNames.push(duplicate.serviceNames[0]);
  assert.equal(hasIssue(duplicate, 'service-inventory'), true);
});
test('refuses missing buckets and unexpected volumes', () => {
  const dropped = clone(); dropped.bucketCount--;
  assert.equal(hasIssue(dropped, 'bucket-inventory'), true);
  const volume = clone(); volume.volumeCount++;
  assert.equal(hasIssue(volume, 'volume-inventory'), true);
});
test('rejects changes to runtime source/build, health and predeploy invariants', () => {
  for (const [key, alternative] of [
    ['repository', 'elsewhere/untrusted'],
    ['branch', 'feature-not-main'],
    ['builder', 'DOCKERFILE'],
    ['healthcheckPath', '/'],
    ['healthcheckTimeout', 300],
    ['preDeployCommand', []],
    ['sleepApplication', false],
    ['restartPolicyMaxRetries', 0],
    ['regionReplicas', { iad: 1 }],
    ['watchPatterns', ['src/**']],
  ]) {
    const candidate = clone(); candidate.website[key] = alternative;
    assert.equal(hasIssue(candidate, 'website.' + key), true, key);
  }
});
test('rejects accidental secret-bearing fields and malformed empty input', () => {
  const candidate = clone(); candidate.environmentVariables = { SECRET_KEY: 'DO-NOT-SAVE' };
  assert.equal(hasIssue(candidate, 'unexpected-fields'), true);
  assert.equal(hasIssue({}, 'service-inventory'), true);
});
test('old railway.json is not used to override effective live builder/health values', () => {
  const legacy = JSON.parse(readFileSync(new URL('../railway.json', import.meta.url), 'utf8'));
  assert.equal(legacy.build.builder, 'DOCKERFILE');
  assert.equal(legacy.deploy.healthcheckTimeout, 300);
  assert.equal(reference.website.builder, 'RAILPACK');
  assert.equal(reference.website.healthcheckTimeout, 90);
});
