import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as model from './receipt-recovery-model.mjs';

const binding = { donation: 'synthetic-gift-a', subject: 'synthetic-subject-a', challenge: 'synthetic-challenge-a', version: 4 };
const challenge = { ...binding, issuedAt: 1000, expiresAt: 2000, state: 'pending' };
const evidence = { ...binding, verifiedAt: 1500, channelVerified: true };
const input = { challenge, evidence, currentVersion: 4, now: 1600 };
const deny = { outcome: 'denied' };
const run = over => model.evaluateRecovery({ ...input, ...over });

test('proposes a single transition only for current verified matching evidence', () => {
  assert.deepEqual(run({}), { outcome: 'candidate', expectedVersion: 4, nextVersion: 5, nextState: 'consumed' });
  assert.deepEqual(run({ now: 1500 }), run({}));
  assert.deepEqual(run({ now: 1999 }), run({}));
});
test('expired, revoked and consumed challenges never propose a second reissue', () => {
  for (const over of [{ now: 2000 }, { now: 2001 }, { challenge: { ...challenge, state: 'consumed' } }, { challenge: { ...challenge, state: 'revoked' } }]) assert.deepEqual(run(over), deny);
});
test('subject, donation, challenge and generation are all bound to the verified evidence', () => {
  for (const field of ['donation', 'subject', 'challenge']) assert.deepEqual(run({ evidence: { ...evidence, [field]: 'synthetic-other' } }), deny);
  assert.deepEqual(run({ evidence: { ...evidence, version: 3 } }), deny);
  assert.deepEqual(run({ currentVersion: 5 }), deny);
  assert.deepEqual(run({ currentVersion: 3 }), deny);
});
test('future, pre-issuance, missing and unverified evidence fail closed', () => {
  for (const over of [{ evidence: { ...evidence, verifiedAt: 999 } }, { evidence: { ...evidence, verifiedAt: 1601 } }, { evidence: { ...evidence, channelVerified: false } }, { evidence: null }, { now: 999 }]) assert.deepEqual(run(over), deny);
});
test('rejects malformed, oversized and non-synthetic inputs without reflecting data', () => {
  for (const over of [{ now: NaN }, { currentVersion: 4.2 }, { challenge: { ...challenge, donation: 'actual-reference' } }, { evidence: { ...evidence, contact: 'PRIVATE_SYNTHETIC' } }, { challenge: { ...challenge, expiresAt: 1000 } }, { challenge: { ...challenge, expiresAt: 901001 } }, { challenge: { ...challenge, state: 'unknown' } }, { extra: true }]) assert.deepEqual(run(over), deny);
  assert.deepEqual(model.evaluateRecovery(null), deny);
});
test('safe version ceiling and immutable input; no token, identity or contact in output', () => {
  const version = Number.MAX_SAFE_INTEGER;
  assert.deepEqual(run({ challenge: { ...challenge, version }, evidence: { ...evidence, version }, currentVersion: version }), deny);
  const before = JSON.stringify(input);
  const result = run({});
  assert.equal(JSON.stringify(input), before);
  assert.deepEqual(Object.keys(result).sort(), ['expectedVersion', 'nextState', 'nextVersion', 'outcome']);
});
