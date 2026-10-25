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

test('rejects missing, duplicate, or substituted auxiliary Railway services', () => {
  const absent = clone(); delete absent.auxiliaryServices;
  assert.equal(hasIssue(absent, 'auxiliary-service-inventory'), true);
  const removed = clone(); removed.auxiliaryServices.pop();
  assert.equal(hasIssue(removed, 'auxiliary-service-inventory'), true);
  const duplicated = clone(); duplicated.auxiliaryServices.push(structuredClone(duplicated.auxiliaryServices[0]));
  assert.equal(hasIssue(duplicated, 'auxiliary-service-inventory'), true);
  const substituted = clone(); substituted.auxiliaryServices[1].name = 'surprise-service';
  assert.equal(hasIssue(substituted, 'auxiliary-service-inventory'), true);
});

test('keeps notification worker dormant, isolated, and incapable of automatic delivery', () => {
  for (const [field, changed] of [
    ['startCommand', 'node run.mjs'],
    ['cronSchedule', '*/5 * * * *'],
    ['rootDirectory', '/'],
    ['builder', 'RAILPACK'],
    ['watchPatterns', ['src/**']],
    ['restartPolicyType', 'ON_FAILURE'],
    ['branch', 'unreviewed-notification-branch'],
    ['regionReplicas', { iad: 2 }],
  ]) {
    const candidate = clone();
    candidate.auxiliaryServices[0][field] = changed;
    assert.equal(hasIssue(candidate, 'auxiliary.amaana-notification-cron.' + field), true, field);
  }
});

test('rejects preview branch, build, health and pinned source drift', () => {
  for (const [field, changed] of [
    ['branch', 'main'], ['pinnedCommitSha', 'not-the-reviewed-commit'],
    ['builder', 'DOCKERFILE'], ['watchPatterns', ['docs/**']],
    ['preDeployCommand', []], ['healthcheckPath', '/'],
    ['healthcheckTimeout', 90], ['sleepApplication', false],
    ['regionReplicas', { iad: 2 }],
  ]) {
    const candidate = clone();
    candidate.auxiliaryServices[1][field] = changed;
    assert.equal(hasIssue(candidate, 'auxiliary.amaana-rebuild-preview.' + field), true, field);
  }
});

test('rejects auxiliary secret-bearing properties but accepts harmless JSON key ordering', () => {
  const unsafe = clone();
  unsafe.auxiliaryServices[0].environmentVariables = { CRON_SECRET: 'never-publish' };
  assert.equal(hasIssue(unsafe, 'unexpected-fields'), true);
  const reordered = clone();
  reordered.auxiliaryServices[0] = Object.fromEntries(Object.entries(reordered.auxiliaryServices[0]).reverse());
  assert.deepEqual(compareMigrationInventory(reference, reordered), []);
});
