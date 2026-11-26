import assert from 'node:assert/strict';
import { test } from 'node:test';
import { evaluateStewardship } from './stewardship-consent-model.mjs';

const subject = 'synthetic-donor-01';
const template = { purpose: 'impact-updates', version: 'review-v1', reviewed: true };
const request = { subject, purpose: 'impact-updates', templateVersion: 'review-v1', asOf: 1000 };
const event = (sequence, kind, purpose = 'impact-updates', at = sequence * 10) => ({ subject, sequence, kind, purpose, at });
const evaluate = (events, changes = {}, review = template) => evaluateStewardship({ ...request, ...changes }, events, review);

test('no explicit consent or consent for another purpose never qualifies', () => {
  assert.equal(evaluate([]).reason, 'no-consent');
  assert.equal(evaluate([event(1, 'grant', 'monthly-giving')]).reason, 'no-consent');
});
test('requires explicit purpose consent and exact reviewed template version, never a send authorization', () => {
  assert.deepEqual(evaluate([event(1, 'grant')]), { candidate: true, reason: 'consent-present' });
  assert.equal(evaluate([event(1, 'grant')], {}, { ...template, reviewed: false }).reason, 'unreviewed-template');
  assert.equal(evaluate([event(1, 'grant')], { templateVersion: 'review-v2' }).reason, 'unreviewed-template');
  assert.equal(evaluate([event(1, 'grant')], {}, { ...template, purpose: 'monthly-giving' }).reason, 'unreviewed-template');
});
test('withdrawal defeats older consent, but a subsequent explicit grant is purpose-specific', () => {
  const history = [event(1, 'grant'), event(2, 'withdraw')];
  assert.equal(evaluate(history).reason, 'withdrawn');
  assert.equal(evaluate([...history, event(3, 'grant', 'monthly-giving')]).reason, 'withdrawn');
  assert.equal(evaluate([...history, event(3, 'grant')]).candidate, true);
});
test('global opt-out, hard bounce and complaint cannot be overridden by a later topic grant', () => {
  for (const kind of ['global-opt-out', 'hard-bounce', 'complaint']) {
    const history = [event(1, 'grant'), event(2, kind, null), event(3, 'grant')];
    assert.deepEqual(evaluate(history), { candidate: false, reason: 'suppressed' });
  }
});
test('rejects incomplete, repeated, out-of-order, cross-subject, future and unknown evidence', () => {
  for (const history of [[event(2, 'grant')], [event(1, 'grant'), event(1, 'withdraw')], [event(1, 'grant', 'impact-updates', 50), event(2, 'withdraw', 'impact-updates', 40)], [{ ...event(1, 'grant'), subject: 'synthetic-donor-02' }], [event(1, 'grant', 'impact-updates', 1001)], [event(1, 'payment-captured')], [event(1, 'global-opt-out')], [{ ...event(1, 'grant'), email: 'synthetic@example.invalid' }], [null]]) {
    assert.deepEqual(evaluate(history), { candidate: false, reason: 'invalid-evidence' });
  }
});
test('rejects invalid requests, excessive history and transactional purpose without exposing inputs', () => {
  for (const changes of [{ subject: 'synthetic@example.invalid' }, { purpose: 'receipt' }, { asOf: NaN }, { email: 'synthetic@example.invalid' }]) assert.equal(evaluate([], changes).reason, 'invalid-evidence');
  assert.equal(evaluate(Array.from({ length: 10001 }, (_, i) => event(i + 1, 'grant'))).reason, 'invalid-evidence');
  assert.equal(evaluate([event(1, 'grant')], {}, { ...template, body: 'private' }).reason, 'unreviewed-template');
});
