import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewSettlements } from './settlement-review.mjs';
import { reviewCrossChannelCredits } from './cross-channel-credit-review.mjs';

const app = (id, kind, reference, amountPaise) => ({ id, kind, reference, amountPaise });
const movement = (id, settlementId, kind, reference, amountPaise) => ({ id, settlementId, kind, reference, amountPaise });
const payout = (id, reference, amountPaise) => ({ id, reference, amountPaise });
const fixture = () => ({
  version: 1, currency: 'INR',
  application: [app('a1', 'capture', 'PAY001', 10000), app('a2', 'refund', 'REF001', 1000), app('a3', 'capture', 'PAY002', 5000), app('a4', 'refund', 'REF002', 500), app('a5', 'capture', 'PAY003', 300), app('a6', 'refund', 'REF003', 200)],
  movements: [movement('m1', 's1', 'capture', 'PAY001', 10000), movement('m2', 's1', 'refund', 'REF001', 1000), movement('m3', 's2', 'capture', 'PAY002', 5000), movement('m4', 's2', 'refund', 'REF002', 500)],
  settlements: [payout('s1', 'UTR001', 9000), payout('s2', 'UTR002', 4500)],
  credits: [payout('b1', 'UTR001', 9000)],
});
const row = (id, kind, amountPaise, outcome, settlementId) => ({ id, kind, amountPaise, outcome, ...(settlementId ? { settlementId } : {}) });
const bucket = (count, amountPaise) => ({ count, amountPaise });

test('partitions each application capture and refund without mistaking a matched movement for a settled payout', () => {
  const f = fixture();
  const before = JSON.stringify(f);
  const r = reviewSettlements(f);
  assert.deepEqual(r.applicationEvidence, [
    row('a1', 'capture', 10000, 'candidate_settlement', 's1'), row('a2', 'refund', 1000, 'candidate_settlement', 's1'),
    row('a3', 'capture', 5000, 'exception_settlement', 's2'), row('a4', 'refund', 500, 'exception_settlement', 's2'),
    row('a5', 'capture', 300, 'unmatched_movement'), row('a6', 'refund', 200, 'unmatched_movement'),
  ]);
  assert.deepEqual(r.applicationSummary, {
    capture: { total: bucket(3, 15300), candidate_settlement: bucket(1, 10000), exception_settlement: bucket(1, 5000), unmatched_movement: bucket(1, 300) },
    refund: { total: bucket(3, 1700), candidate_settlement: bucket(1, 1000), exception_settlement: bucket(1, 500), unmatched_movement: bucket(1, 200) },
  });
  assert.deepEqual(r.unmatchedApplicationIds, ['a5', 'a6']);
  assert.equal(r.summary.candidatePaise, 9000);
  assert.equal(JSON.stringify(f), before);
  assert.ok(!/PAY00|REF00|UTR00/.test(JSON.stringify(r)));
});
test('duplicate movement, amount mismatch and unlinked movement are not classified as matched evidence', () => {
  const f = fixture();
  f.movements.push(movement('m5', 'missing', 'capture', 'PAY001', 10000), movement('m6', 'missing', 'capture', 'PAY003', 300));
  f.movements[3].amountPaise = 499;
  const r = reviewSettlements(f);
  assert.deepEqual(r.applicationEvidence.map(x => x.outcome), ['unmatched_movement', 'exception_settlement', 'exception_settlement', 'unmatched_movement', 'unmatched_movement', 'unmatched_movement']);
  assert.deepEqual(r.unlinkedMovementIds, ['m5', 'm6']);
  assert.deepEqual(r.unmatchedApplicationIds, ['a1', 'a4', 'a5', 'a6']);
});
test('shared-credit conflict downgrades all matched movements in the affected settlement', () => {
  const f = fixture();
  const r = reviewCrossChannelCredits({ ...f, claims: [{ ...payout('c1', 'UTR001', 9000), day: '2026-11-26' }], credits: f.credits.map(c => ({ ...c, day: '2026-11-26' })) });
  assert.deepEqual(r.applicationEvidence.map(x => x.outcome), ['exception_settlement', 'exception_settlement', 'exception_settlement', 'exception_settlement', 'unmatched_movement', 'unmatched_movement']);
  assert.deepEqual(r.applicationSummary.capture.exception_settlement, bucket(2, 15000));
  assert.deepEqual(r.applicationSummary.refund.exception_settlement, bucket(2, 1500));
  assert.deepEqual(r.applicationSummary.capture.candidate_settlement, bucket(0, 0));
  assert.equal(r.summary.settlementCandidatePaise, 0);
});
test('empty inputs remain nonauthoritative with explicit zero buckets', () => {
  const f = { version: 1, currency: 'INR', application: [], movements: [], settlements: [], credits: [] };
  const r = reviewSettlements(f);
  assert.deepEqual(r.applicationEvidence, []);
  assert.deepEqual(r.applicationSummary.capture.total, bucket(0, 0));
  assert.deepEqual(r.applicationSummary.refund.total, bucket(0, 0));
  assert.equal(r.authoritative, false);
});
test('conserves integer paise across 10,000 distinct application records and does not double count', () => {
  const f = { version: 1, currency: 'INR', application: [], movements: [], settlements: [], credits: [] };
  for (let i = 0; i < 5000; i++) {
    const pay = `PAY${String(i).padStart(6,'0')}`, refund = `REF${String(i).padStart(6,'0')}`, utr = `UTR${String(i).padStart(6,'0')}`;
    f.application.push(app(`a${i}`, 'capture', pay, 101), app(`r${i}`, 'refund', refund, 1));
    if (i % 5 === 0) continue;
    f.movements.push(movement(`m${i}`, `s${i}`, 'capture', pay, 101), movement(`n${i}`, `s${i}`, 'refund', refund, 1));
    f.settlements.push(payout(`s${i}`, utr, 100));
    if (i % 2 === 0) f.credits.push(payout(`b${i}`, utr, 100));
  }
  const r = reviewSettlements(f);
  assert.equal(new Set(r.applicationEvidence.map(x => x.id)).size, 10000);
  for (const [kind, amount] of [['capture',101], ['refund',1]]) {
    const s = r.applicationSummary[kind];
    assert.deepEqual(s.total, bucket(5000, 5000 * amount));
    assert.deepEqual(s.candidate_settlement, bucket(2000, 2000 * amount));
    assert.deepEqual(s.exception_settlement, bucket(2000, 2000 * amount));
    assert.deepEqual(s.unmatched_movement, bucket(1000, 1000 * amount));
  }
});
