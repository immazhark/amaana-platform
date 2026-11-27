import './test-taleem-reservation-batch.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHold, evaluateReservationTransition } from './taleem-reservation-model.mjs';
const now = 1000;
const request = { id: 'new', programme: 'qaida', startMonth: '2026-12', months: 3, units: 2, expiresAt: 2000 };
const capacities = ['2026-12','2027-01','2027-02'].map(month => ({ programme: 'qaida', month, units: 3 }));
const hold = (over = {}) => ({ ...request, id: 'existing', units: 1, state: 'held', ...over });
const run = (rows = [], over = {}, slots = capacities, at = now) => evaluateHold({ capacities: slots, reservations: rows, request: { ...request, ...over }, now: at });
test('all months must have enough approved units, across year boundaries', () => {
  assert.deepEqual(run([hold()]), { outcome: 'candidate', minimumRemaining: 2 });
  assert.deepEqual(run([hold({ startMonth: '2027-01', months: 1, units: 2 })]), { outcome: 'insufficient_capacity', minimumRemaining: 1 });
});
test('expired and released holds do not occupy inventory; committed units do', () => {
  assert.equal(run([hold({ units: 3, expiresAt: now })]).outcome, 'candidate');
  assert.equal(run([hold({ units: 3, state: 'released' })]).outcome, 'candidate');
  assert.equal(run([hold({ units: 2, state: 'committed', expiresAt: 900 })]).outcome, 'insufficient_capacity');
});
test('missing month capacity is not availability; programmes remain independent', () => {
  assert.equal(run([], {}, capacities.slice(0, 2)).outcome, 'capacity_unknown');
  assert.equal(run([hold({ programme: 'nazira', units: 50 })], {}, [...capacities, ...capacities.map(c => ({ ...c, programme: 'nazira', units: 50 }))]).outcome, 'candidate');
});
test('exact replay never consumes a second unit or extends an expired hold', () => {
  assert.equal(run([{ ...request, state: 'held' }]).outcome, 'already_held');
  assert.equal(run([{ ...request, state: 'committed' }]).outcome, 'already_committed');
  assert.equal(run([{ ...request, state: 'released' }]).outcome, 'id_conflict');
  assert.equal(run([{ ...request, state: 'held' }], { units: 1 }).outcome, 'id_conflict');
  assert.equal(run([{ ...request, state: 'held' }], {}, capacities, 2000).outcome, 'invalid_request');
});
test('malformed or inconsistent inventory fails closed', () => {
  for (const rows of [[hold(),hold()], [hold({ units: 0 })], [hold({ state: 'unknown' })], [hold({ startMonth: '2026-13' })], [hold({ programme: 'unknown' })], [hold({ state: 'committed', units: 4 })]]) assert.equal(run(rows).outcome, 'invalid_inventory');
  assert.equal(run([], {}, [...capacities,capacities[0]]).outcome, 'invalid_inventory');
  assert.equal(run([hold()], {}, capacities.slice(0,2)).outcome, 'invalid_inventory');
});
test('invalid request and clock do not create a candidate', () => {
  for (const over of [{ months: 2 },{ units: 0 },{ units: 51 },{ startMonth: '2026-00' },{ programme: 'unknown' },{ expiresAt: now },{ id: 'not valid' }]) assert.equal(run([],over).outcome, 'invalid_request');
  assert.equal(run([],{},capacities,NaN).outcome,'invalid_request');
});
test('candidate is a pure advisory result and does not mutate inputs', () => {
  const rows = [hold()]; const before = JSON.stringify({rows,capacities,request});
  assert.equal(run(rows).outcome,'candidate'); assert.equal(JSON.stringify({rows,capacities,request}),before);
});

const transitionRequest = { id: 'synthetic-01', programme: 'qaida', startMonth: '2026-12', months: 3, units: 2, expiresAt: 2000 };
const transitionRow = (state = 'held') => ({ ...transitionRequest, state });
const transition = (action, state = 'held', now = 1000, expected = transitionRequest) => evaluateReservationTransition({ reservation: transitionRow(state), expected, action, now });
test('a live hold can become a committed candidate, without changing its immutable terms', () => {
  assert.deepEqual(transition('confirm'), { outcome: 'candidate', nextState: 'committed' });
  assert.deepEqual(transition('confirm', 'held', 1999), { outcome: 'candidate', nextState: 'committed' });
});
test('confirmation at or after expiry requires separate review; no revived capacity', () => {
  for (const now of [2000, 2001]) assert.deepEqual(transition('confirm', 'held', now), { outcome: 'late_confirmation' });
  assert.deepEqual(transition('confirm', 'released', 1000), { outcome: 'released_confirmation' });
});
test('expiry and release cannot cancel committed inventory; repeat confirmation is idempotent', () => {
  assert.deepEqual(transition('confirm', 'committed', 5000), { outcome: 'unchanged' });
  assert.deepEqual(transition('expire', 'committed', 5000), { outcome: 'unchanged' });
  assert.deepEqual(transition('release', 'committed'), { outcome: 'committed_release_review' });
});
test('uncommitted expiry is inclusive and release is idempotent', () => {
  assert.deepEqual(transition('expire', 'held', 1999), { outcome: 'unchanged' });
  assert.deepEqual(transition('expire', 'held', 2000), { outcome: 'candidate', nextState: 'released' });
  assert.deepEqual(transition('release'), { outcome: 'candidate', nextState: 'released' });
  for (const action of ['release', 'expire']) assert.deepEqual(transition(action, 'released'), { outcome: 'unchanged' });
});
test('mismatched immutable evidence, malformed state, clock and private extras fail closed', () => {
  for (const change of [{ id: 'different' }, { programme: 'nazira' }, { startMonth: '2027-01' }, { months: 6 }, { units: 3 }, { expiresAt: 3000 }]) assert.deepEqual(transition('confirm', 'held', 1000, { ...transitionRequest, ...change }), { outcome: 'id_conflict' });
  for (const result of [transition('other'), transition('confirm', 'unknown'), transition('confirm', 'held', NaN), transition('confirm', 'held', 1000, { ...transitionRequest, private: 'synthetic' }), evaluateReservationTransition(null)]) assert.deepEqual(result, { outcome: 'invalid_transition' });
});
test('a candidate never mutates its supplied reservation or expected request', () => {
  const reservation = transitionRow(); const input = { reservation, expected: transitionRequest, action: 'confirm', now: 1000 };
  const before = JSON.stringify(input);
  assert.equal(evaluateReservationTransition(input).outcome, 'candidate');
  assert.equal(JSON.stringify(input), before);
});
