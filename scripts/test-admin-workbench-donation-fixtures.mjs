import assert from 'node:assert/strict';
import { test } from 'node:test';
import { workbenchDonationFixtures } from './admin-workbench-donation-fixtures.mjs';

const now = new Date('2026-11-27T00:00:00Z');
const hash = value => 'synthetic-' + value;
test('every workbench donation has exactly one dedicated destination and valid payment method shape', () => {
  const { first, second, claim } = workbenchDonationFixtures('synthetic-appeal', now, hash);
  for (const row of [first, second, claim]) {
    assert.equal(row.appealId, 'synthetic-appeal');
    assert.equal(row.fundId, null);
    assert.equal(row.providerPaymentId, null);
  }
  for (const row of [first, second]) {
    assert.equal(row.paymentMethod, 'RAZORPAY');
    assert.equal(row.status, 'CREATED');
    assert.equal(row.provider, 'razorpay');
    assert.match(row.providerOrderId, /^order_synthetic_workbench_0[12]$/);
    assert.equal(row.transferReference, null);
    assert.equal(row.transferredAt, null);
    assert.equal(row.createdAt.toISOString(), '2020-01-02T00:00:00.000Z');
  }
  assert.notEqual(first.providerOrderId, second.providerOrderId);
  assert.equal(claim.paymentMethod, 'DIRECT_UPI');
  assert.equal(claim.status, 'PENDING_VERIFICATION');
  assert.equal(claim.provider, null);
  assert.equal(claim.providerOrderId, null);
  assert.equal(claim.transferredAt, now);
  assert.equal(claim.createdAt, now);
  assert.equal(claim.amount, '100');
  assert.ok(claim.transferReference);
  assert.equal(new Set([first,second,claim].map(row=>row.receiptTokenHash)).size,3);
});
test('refuses a missing destination before fixture creation', () => {
  for (const id of [undefined, null, '', ' ', 42]) assert.throws(() => workbenchDonationFixtures(id, now, hash));
});
