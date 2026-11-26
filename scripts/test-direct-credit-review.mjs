import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reviewDirectCredits } from './direct-credit-review.mjs';
const claim = (id, reference, amountPaise = 10000, day = '2026-11-26') => ({ id, reference, amountPaise, day });
const credit = claim;
const batch = (claims, credits) => ({ version: 1, currency: 'INR', claims, credits });
test('one exact unique reference, amount and date is a candidate, not a verified donation', () => {
  const r = reviewDirectCredits(batch([claim('c1', 'REF001')], [credit('b1', 'REF001')]));
  assert.deepEqual(r.claims, [{ id: 'c1', outcome: 'candidate', creditId: 'b1' }]);
  assert.deepEqual(r.credits, [{ id: 'b1', outcome: 'candidate', claimId: 'c1' }]);
  assert.equal(r.summary.candidatePaise, 10000);
  assert.equal(r.authoritative, false);
  assert.ok(!JSON.stringify(r).includes('REF001'));
});
test('does not match by amount alone, reference case, or approximate date', () => {
  const r = reviewDirectCredits(batch([claim('c1','REF001'),claim('c2','REF002'),claim('c3','REF003')], [credit('b1','ref001'),credit('b2','REF002',9999),credit('b3','REF003',10000,'2026-11-25')]));
  assert.deepEqual(r.claims.map(x=>x.outcome), ['no_credit','amount_mismatch','date_mismatch']);
  assert.deepEqual(r.credits.map(x=>x.outcome), ['unclaimed','amount_mismatch','date_mismatch']);
  assert.equal(r.summary.candidatePaise, 0);
});
test('duplicates on either side quarantine the whole reference group', () => {
  const r = reviewDirectCredits(batch([claim('c1','REF001'),claim('c2','REF001'),claim('c3','REF002')], [credit('b1','REF001'),credit('b2','REF002'),credit('b3','REF002')]));
  assert.ok([...r.claims,...r.credits].every(x=>x.outcome==='ambiguous_reference'));
  assert.equal(r.summary.candidatePaise,0);
});
test('reports unclaimed credits and pending claims independently, with exact totals', () => {
  const r = reviewDirectCredits(batch([claim('c1','REF001',101),claim('c2','REF002',202)], [credit('b1','REF001',101),credit('b2','REF003',303)]));
  assert.deepEqual(r.summary,{claimCount:2,creditCount:2,candidateCount:1,candidatePaise:101,claimPaise:303,creditPaise:404,claimExceptionPaise:202,creditExceptionPaise:303});
});
test('rejects invalid shape, unknown personal fields, currency, dates, repeated ids and unsafe amounts without echoing input', () => {
  const valid=claim('c1','REF001');
  const bad=[{...batch([],[]),currency:'USD'},{...batch([],[]),donorEmail:'SECRET@example.test'},batch([{...valid,donorName:'SECRET'}],[]),batch([{...valid,day:'2026-02-30'}],[]),batch([valid,{...valid,reference:'REF002'}],[]),batch([{...valid,amountPaise:0}],[]),batch([{...valid,amountPaise:1.01}],[]),batch([{...valid,amountPaise:Number.MAX_SAFE_INTEGER+1}],[]),batch([{...valid,reference:'=SECRET'}],[]),batch([{...valid,id:'SECRET@example.test'}],[])];
  for(const input of bad) assert.throws(()=>reviewDirectCredits(input), e=>e instanceof Error&&!e.message.includes('SECRET'));
});
test('empty input is an empty review, not confirmation of bank completeness', () => {
  const r=reviewDirectCredits(batch([],[])); assert.equal(r.authoritative,false); assert.equal(r.summary.candidateCount,0);
});
test('rejects a batch with unsafe cumulative paise totals',()=>{
  assert.throws(()=>reviewDirectCredits(batch([claim('c1','REF001',Number.MAX_SAFE_INTEGER),claim('c2','REF002',1)],[])), /safe integer/);
});
test('handles a large disjoint synthetic batch with one-to-one matches',()=>{
  const claims=Array.from({length:10000},(_,i)=>claim('c'+i,'REF'+String(i).padStart(6,'0'),101));
  const credits=claims.map((c,i)=>({...c,id:'b'+i})).reverse();
  const r=reviewDirectCredits(batch(claims,credits));assert.equal(r.summary.candidateCount,10000);assert.equal(r.summary.candidatePaise,1010000);assert.equal(r.claims[9999].creditId,'b9999');
});

test('offline CLI emits candidate report only and rejects malformed JSON without echoing private values',()=>{
  const path=fileURLToPath(new URL('./direct-credit-review.mjs',import.meta.url));
  const run=input=>spawnSync(process.execPath,[path],{input,encoding:'utf8'});
  const good=run(JSON.stringify(batch([claim('c1','REF001')],[credit('b1','REF001')])));
  assert.equal(good.status,0);assert.equal(JSON.parse(good.stdout).summary.candidateCount,1);assert.equal(good.stderr,'');
  for(const input of ['{SECRET@example.test',JSON.stringify({...batch([],[]),donorEmail:'SECRET@example.test'})]) {
    const bad=run(input);assert.equal(bad.status,1);assert.equal(bad.stdout,'');assert.ok(!bad.stderr.includes('SECRET'));
  }
});
