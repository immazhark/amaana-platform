import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewCrossChannelCredits } from './cross-channel-credit-review.mjs';

const direct = (id, reference, amountPaise, day = '2026-11-26') => ({ id, reference, amountPaise, day });
const payout = (id, reference, amountPaise) => ({ id, reference, amountPaise });
const empty = () => ({ version: 1, currency: 'INR', claims: [], application: [], movements: [], settlements: [], credits: [] });
const bucket = (count, amountPaise) => ({ count, amountPaise });
function addPayout(input, id, reference, amountPaise) {
  const payment = 'PAY' + id.padStart(6, '0');
  input.application.push({ id: 'a'+id, kind: 'capture', reference: payment, amountPaise });
  input.movements.push({ id: 'm'+id, settlementId: id, kind: 'capture', reference: payment, amountPaise });
  input.settlements.push(payout(id, reference, amountPaise));
}
function assertConservation(partition) {
  const sum = Object.values(partition.byOutcome).reduce((acc, row) => bucket(acc.count + row.count, acc.amountPaise + row.amountPaise), bucket(0, 0));
  assert.deepEqual(partition.total, sum);
}
test('each source partitions its own amounts after final shared-credit conflict handling', () => {
  const input = empty();
  input.claims.push(direct('c1','UTR001',100), direct('c2','UTR002',200), direct('c3','UTR003',300), direct('c4','UTR004',400), direct('c5','UTR005',500), direct('c6','UTR006',600), direct('c7','UTR006',700));
  input.credits.push(direct('b1','UTR001',100), direct('b2','UTR002',200), direct('b4','UTR004',401), direct('b5','UTR005',500,'2026-11-25'), direct('b6','UTR006',600), direct('b7','UTR006',700), direct('b8','UTR008',800), direct('b9','UTR009',900));
  addPayout(input,'s2','UTR002',200); addPayout(input,'s8','UTR008',800); addPayout(input,'s10','UTR010',1000);
  const report = reviewCrossChannelCredits(input);
  const { claims, settlements, credits } = report.controlTotals;
  assert.deepEqual(claims, { total: bucket(7,2800), byOutcome: { candidate: bucket(1,100), cross_channel_conflict: bucket(1,200), ambiguous_reference: bucket(2,1300), no_credit: bucket(1,300), amount_mismatch: bucket(1,400), date_mismatch: bucket(1,500) } });
  assert.deepEqual(settlements, { total: bucket(3,2000), byOutcome: { candidate: bucket(1,800), cross_channel_conflict: bucket(1,200), other_exception: bucket(1,1000) } });
  assert.deepEqual(credits, { total: bucket(8,4201), byOutcome: { direct_candidate: bucket(1,100), settlement_candidate: bucket(1,800), cross_channel_conflict: bucket(1,200), ambiguous_reference: bucket(2,1300), unmatched: bucket(3,1801) } });
  for (const partition of [claims,settlements,credits]) assertConservation(partition);
  assert.equal(report.authoritative,false);
  assert.ok(!/UTR00|PAY000/.test(JSON.stringify(report)));
  assert.equal(report.summary.directCandidatePaise,claims.byOutcome.candidate.amountPaise);
  assert.equal(report.summary.settlementCandidatePaise,settlements.byOutcome.candidate.amountPaise);
});
test('empty inputs preserve fixed zero buckets, without claiming reconciliation completeness', () => {
  const report = reviewCrossChannelCredits(empty());
  assert.equal(report.authoritative,false);
  for (const partition of Object.values(report.controlTotals)) {
    assert.deepEqual(partition.total,bucket(0,0));
    for (const value of Object.values(partition.byOutcome)) assert.deepEqual(value,bucket(0,0));
    assertConservation(partition);
  }
  assert.equal(Object.keys(report.controlTotals.claims.byOutcome).length,6);
  assert.equal(Object.keys(report.controlTotals.settlements.byOutcome).length,3);
  assert.equal(Object.keys(report.controlTotals.credits.byOutcome).length,5);
});
test('conflicts remain quarantined on both source sides even without a credit', () => {
  const input = empty();
  input.claims.push(direct('c1','UTR001',99));
  addPayout(input,'s1','UTR001',100);
  const { controlTotals,summary } = reviewCrossChannelCredits(input);
  assert.deepEqual(controlTotals.claims.byOutcome.cross_channel_conflict,bucket(1,99));
  assert.deepEqual(controlTotals.settlements.byOutcome.cross_channel_conflict,bucket(1,100));
  assert.deepEqual(controlTotals.credits.total,bucket(0,0));
  assert.equal(summary.directCandidateCount+summary.settlementCandidateCount,0);
});
test('large disjoint source totals stay exact and are not added across sides', () => {
  const input = empty();
  input.claims.push(direct('c1','UTR001',Number.MAX_SAFE_INTEGER));
  input.credits.push(direct('b1','UTR001',Number.MAX_SAFE_INTEGER));
  const { controlTotals } = reviewCrossChannelCredits(input);
  assert.deepEqual(controlTotals.claims.total,bucket(1,Number.MAX_SAFE_INTEGER));
  assert.deepEqual(controlTotals.credits.total,bucket(1,Number.MAX_SAFE_INTEGER));
  input.claims.push(direct('c2','UTR002',1));
  assert.throws(()=>reviewCrossChannelCredits(input),/safe integer/);
});
