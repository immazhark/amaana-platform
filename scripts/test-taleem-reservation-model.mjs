import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHold } from './taleem-reservation-model.mjs';
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
