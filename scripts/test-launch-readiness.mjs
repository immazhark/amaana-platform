import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLaunchReadinessRegister, readinessSummary, validateLaunchReadinessRegister } from './check-launch-readiness.mjs';

test('current launch register is structurally valid and remains intentionally blocked', async () => {
  const { gates } = await loadLaunchReadinessRegister();
  const rehearsal = readinessSummary(gates, 'rehearsal');
  const production = readinessSummary(gates, 'production');

  assert.deepEqual(
    rehearsal.unresolved.map(gate => gate.id).sort(),
    ['database-backup-evidence', 'rollback-rehearsal'],
  );
  assert.ok(production.unresolved.some(gate => gate.id === 'manual-rendered-accessibility-review'));
  assert.ok(production.unresolved.some(gate => gate.id === 'final-editorial-seo-social-review'));
  assert.ok(production.unresolved.some(gate => gate.id === 'public-media-human-review'));
  assert.ok(production.unresolved.some(gate => gate.id === 'public-media-upload-delivery'));
  assert.ok(production.unresolved.some(gate => gate.id === 'razorpay-live-kyc-readiness'));
  assert.ok(production.unresolved.some(gate => gate.id === 'main-promotion-and-production-approval'));
});

test('VERIFIED gates require evidence date and unresolved gates cannot impersonate verification', () => {
  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [{
    id: 'verified-without-date', category: 'test', status: 'VERIFIED', requiredFor: ['production'], evidence: 'Strong evidence exists here.',
  }] }), /VERIFIED without verifiedAt/);

  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [{
    id: 'pending-with-date', category: 'test', status: 'PENDING', requiredFor: ['production'], evidence: 'Still waiting for external evidence.', verifiedAt: '2026-09-16',
  }] }), /must not carry verifiedAt/);
});

test('unknown targets, duplicate ids and unsupported statuses fail closed', () => {
  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [{
    id: 'bad-target', category: 'test', status: 'PENDING', requiredFor: ['someday'], evidence: 'This target is deliberately invalid.',
  }] }), /unsupported target/);

  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [
    { id: 'same', category: 'test', status: 'PENDING', requiredFor: ['production'], evidence: 'First duplicate gate evidence.' },
    { id: 'same', category: 'test', status: 'PENDING', requiredFor: ['production'], evidence: 'Second duplicate gate evidence.' },
  ] }), /unique id/);

  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [{
    id: 'bad-status', category: 'test', status: 'ASSUMED', requiredFor: ['production'], evidence: 'Assumptions cannot become readiness.',
  }] }), /unsupported status/);
});

test('not-applicable gates require an explicit reason', () => {
  assert.throws(() => validateLaunchReadinessRegister({ version: 1, gates: [{
    id: 'na-without-reason', category: 'test', status: 'NOT_APPLICABLE', requiredFor: ['production'], evidence: 'A reason is still required here.',
  }] }), /notApplicableReason/);
});
