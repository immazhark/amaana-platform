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

const operationalProfiles = {
  'amaana-rebuild-preview': {
    repository: 'immazhark/amaana-platform',
    branch: 'phase-public-site-rebuild',
    builder: 'RAILPACK',
    healthcheckTimeout: 300,
    regionReplicas: { iad: 1 },
  },
  'amaana-notification-cron': {
    repository: 'immazhark/amaana-platform',
    branch: 'main',
    rootDirectory: '/ops/notification-cron',
    builder: 'DOCKERFILE',
    dockerfilePath: 'Dockerfile',
    startCommand: 'node --check run.mjs',
    cronSchedule: '0 0 1 1 *',
    restartPolicyType: 'NEVER',
    regionReplicas: { iad: 1 },
  },
};

test('requires an exact operational profile for both other live services', () => {
  const baseline = { ...reference, operationalProfiles };
  assert.deepEqual(compareMigrationInventory(baseline, structuredClone(baseline)), []);
  const omitted = structuredClone(baseline);
  delete omitted.operationalProfiles['amaana-notification-cron'];
  assert.ok(compareMigrationInventory(baseline, omitted).some(issue => issue.code === 'operational-profiles'));
});

test('rejects enabling notification delivery or widening worker builds', () => {
  const baseline = { ...reference, operationalProfiles };
  for (const [field, alternative] of [
    ['cronSchedule', '*/5 * * * *'],
    ['startCommand', 'node run.mjs'],
    ['rootDirectory', '/'],
    ['builder', 'RAILPACK'],
    ['restartPolicyType', 'ON_FAILURE'],
    ['regionReplicas', { iad: 2 }],
  ]) {
    const changed = structuredClone(baseline);
    changed.operationalProfiles['amaana-notification-cron'][field] = alternative;
    assert.ok(compareMigrationInventory(baseline, changed).some(issue =>
      issue.code === 'operational.amaana-notification-cron.' + field), field);
  }
});

test('rejects preview environment drift and extra secret-bearing profile keys', () => {
  const baseline = { ...reference, operationalProfiles };
  const changed = structuredClone(baseline);
  changed.operationalProfiles['amaana-rebuild-preview'].branch = 'main';
  assert.ok(compareMigrationInventory(baseline, changed).some(issue =>
    issue.code === 'operational.amaana-rebuild-preview.branch'));
  const secret = structuredClone(baseline);
  secret.operationalProfiles['amaana-notification-cron'].environmentVariables = { CREDENTIAL: 'fixture' };
  assert.ok(compareMigrationInventory(baseline, secret).some(issue => issue.code === 'unexpected-fields'));
});
