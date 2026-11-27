import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as model from './taleem-reservation-model.mjs';
const now = 1000;
const first = { id: 'first', programme: 'qaida', startMonth: '2026-12', months: 3, units: 2, expiresAt: 2000 };
const second = { ...first, id: 'second', startMonth: '2027-01', months: 1 };
const capacities = ['2026-12', '2027-01', '2027-02'].map(month => ({ programme: 'qaida', month, units: 3 }));
const batch = (requests, reservations = [], slots = capacities) => model.evaluateHoldBatch({ capacities: slots, reservations, requests, now });
test('independently admissible requests cannot overbook a shared month', () => {
  for (const request of [first, second]) assert.equal(model.evaluateHold({ capacities, reservations: [], request, now }).outcome, 'candidate');
  assert.deepEqual(batch([first, second]), { outcome: 'insufficient_capacity', requestIndex: 1, minimumRemaining: 1 });
});
test('a fitting batch returns only new held proposals and does not mutate input', () => {
  const requests = [first, { ...second, units: 1 }];
  const input = { capacities, reservations: [], requests, now };
  const before = JSON.stringify(input);
  assert.deepEqual(model.evaluateHoldBatch(input), { outcome: 'candidate', proposals: requests.map(request => ({ ...request, state: 'held' })) });
  assert.equal(JSON.stringify(input), before);
});
test('replay is not another allocation; committed occupancy survives expiry', () => {
  const prior = { ...first, state: 'committed' };
  assert.deepEqual(batch([first, { ...second, units: 1 }], [prior]), { outcome: 'candidate', proposals: [{ ...second, units: 1, state: 'held' }] });
  assert.deepEqual(batch([first], [prior]), { outcome: 'candidate', proposals: [] });
  assert.deepEqual(batch([second], [{ ...prior, expiresAt: 999 }]), { outcome: 'insufficient_capacity', requestIndex: 0, minimumRemaining: 1 });
  assert.equal(batch([first], [{ ...first, state: 'released' }]).outcome, 'id_conflict');
});
test('unknown or invalid inventory never returns a partial proposal', () => {
  assert.deepEqual(batch([first, { ...second, programme: 'nazira' }]), { outcome: 'capacity_unknown', requestIndex: 1 });
  assert.deepEqual(batch([first], [], [...capacities, capacities[0]]), { outcome: 'invalid_inventory' });
  assert.deepEqual(batch([first], [{ ...first, units: 4, state: 'committed' }]), { outcome: 'invalid_inventory' });
});
test('duplicate, empty, expired, malformed and oversized batches fail closed', () => {
  for (const requests of [[], [first, first], [{ ...first, expiresAt: now }], [{ ...first, private: 'synthetic' }], Array.from({ length: 51 }, (_, i) => ({ ...first, id: `req-${i}` }))]) assert.deepEqual(batch(requests), { outcome: 'invalid_request' });
});
test('single-request baseline still admits an exact fit and rejects an unknown month', () => {
  assert.deepEqual(model.evaluateHold({ capacities, reservations: [], request: { ...first, units: 3 }, now }), { outcome: 'candidate', minimumRemaining: 3 });
  assert.deepEqual(model.evaluateHold({ capacities: capacities.slice(0, 2), reservations: [], request: first, now }), { outcome: 'capacity_unknown' });
});
