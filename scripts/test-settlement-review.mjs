import assert from 'node:assert/strict';
import { test } from 'node:test';
import { reviewSettlements } from './settlement-review.mjs';
const app = (id, kind, reference, amountPaise) => ({ id, kind, reference, amountPaise });
const line = (id, settlementId, kind, reference, amountPaise) => ({ id, settlementId, kind, reference, amountPaise });
const payout = (id, reference, amountPaise) => ({ id, reference, amountPaise });
const fixture = () => ({ version: 1, currency: 'INR', application: [app('a1','capture','PAY001',10000),app('a2','refund','REF001',1500)], movements: [line('m1','s1','capture','PAY001',10000),line('m2','s1','refund','REF001',1500),line('m3','s1','fee',null,200),line('m4','s1','tax',null,36)], settlements: [payout('s1','UTR001',8264)], credits: [payout('b1','UTR001',8264)] });
test('checks application charge/refund, net settlement and bank credit independently', () => {
  const r=reviewSettlements(fixture());
  assert.equal(r.authoritative,false);
  assert.deepEqual(r.settlements,[{id:'s1',outcome:'candidate',issues:[],movementNetPaise:8264,declaredPaise:8264,creditId:'b1'}]);
  assert.equal(r.summary.candidatePaise,8264);
  assert.ok(!/PAY001|REF001|UTR001/.test(JSON.stringify(r)));
});
test('matching bank credit cannot hide incorrect application amount or payout arithmetic', () => {
  const f=fixture();f.application[0].amountPaise=9999;f.settlements[0].amountPaise=8265;f.credits[0].amountPaise=8265;
  const r=reviewSettlements(f);assert.deepEqual(r.settlements[0].issues,['application_movement_mismatch','settlement_total_mismatch']);assert.equal(r.summary.candidatePaise,0);
});
test('duplicate provider movements quarantine every affected settlement', () => {
  const f=fixture();f.movements.push(line('m5','s2','capture','PAY001',10000));f.settlements.push(payout('s2','UTR002',10000));f.credits.push(payout('b2','UTR002',10000));
  const r=reviewSettlements(f);assert.ok(r.settlements.every(s=>s.issues.includes('application_movement_mismatch')));assert.equal(r.summary.candidateCount,0);
});
test('duplicate payout reference or bank reference is ambiguous even when amounts tie', () => {
  const f=fixture();f.credits.push(payout('b2','UTR001',8264));assert.ok(reviewSettlements(f).settlements[0].issues.includes('ambiguous_bank_reference'));
  const g=fixture();g.settlements.push(payout('s2','UTR001',8264));assert.ok(reviewSettlements(g).settlements.every(s=>s.issues.includes('ambiguous_bank_reference')));
});
test('missing bank credit and bank amount mismatch stay exceptions', () => {
  const f=fixture();f.credits=[];assert.ok(reviewSettlements(f).settlements[0].issues.includes('missing_bank_credit'));
  const g=fixture();g.credits[0].amountPaise=8263;assert.ok(reviewSettlements(g).settlements[0].issues.includes('bank_amount_mismatch'));
});
test('explicit adjustments require manual review even when arithmetic ties', () => {
  const f=fixture();f.movements.push(line('m5','s1','adjustment_credit',null,100));f.settlements[0].amountPaise+=100;f.credits[0].amountPaise+=100;
  const r=reviewSettlements(f);assert.deepEqual(r.settlements[0].issues,['adjustment_review_required']);assert.equal(r.summary.candidateCount,0);
});
test('unlinked movements, unrepresented application transactions and bank credits are surfaced', () => {
  const f=fixture();f.movements.push(line('m5','missing','fee',null,100));f.application.push(app('a3','capture','PAY002',100));f.credits.push(payout('b2','UTR002',100));
  const r=reviewSettlements(f);assert.deepEqual(r.unlinkedMovementIds,['m5']);assert.deepEqual(r.unmatchedApplicationIds,['a3']);assert.deepEqual(r.unmatchedCreditIds,['b2']);assert.equal(r.summary.candidateCount,1);
});
test('empty batch is not proof of completeness; empty settlement cannot be a candidate', () => {
  const r=reviewSettlements({version:1,currency:'INR',application:[],movements:[],settlements:[],credits:[]});assert.equal(r.authoritative,false);assert.equal(r.summary.candidateCount,0);
  const f=fixture();f.movements=[];assert.ok(reviewSettlements(f).settlements[0].issues.includes('missing_movements'));
});
test('rejects unknown fields and kinds, invalid identifiers, duplicate IDs and unsafe sums', () => {
  const changes=[f=>f.currency='USD',f=>f.application[0].name='PRIVATE',f=>f.movements[0].kind='other',f=>f.movements[0].amountPaise=0,f=>f.movements[0].reference=null,f=>f.movements[2].reference='PAY001',f=>f.movements.push({...f.movements[0]}),f=>f.credits[0].id='PRIVATE@email.test',f=>{f.movements[0].amountPaise=Number.MAX_SAFE_INTEGER;f.movements[1].kind='capture';f.movements[1].amountPaise=1;}];
  for(const change of changes){const f=fixture();change(f);assert.throws(()=>reviewSettlements(f),e=>e instanceof Error&&!e.message.includes('PRIVATE'));}
});
test('indexes a large synthetic batch without pairing by amount alone', () => {
  const f={version:1,currency:'INR',application:[],movements:[],settlements:[],credits:[]};
  for(let i=0;i<10000;i++){const ref='PAY'+String(i).padStart(6,'0'),utr='UTR'+String(i).padStart(6,'0');f.application.push(app('a'+i,'capture',ref,101));f.movements.push(line('m'+i,'s'+i,'capture',ref,101));f.settlements.push(payout('s'+i,utr,101));f.credits.unshift(payout('b'+i,utr,101));}
  const r=reviewSettlements(f);assert.equal(r.summary.candidateCount,10000);assert.equal(r.summary.candidatePaise,1010000);
});

test('CLI reads normalized JSON from stdin and refuses private or malformed input without echo', async () => {
  const { spawnSync } = await import('node:child_process');
  const { fileURLToPath } = await import('node:url');
  const path = fileURLToPath(new URL('./settlement-review.mjs', import.meta.url));
  const run = input => spawnSync(process.execPath, [path], { input, encoding: 'utf8' });
  const good = run(JSON.stringify(fixture()));
  assert.equal(good.status, 0);assert.equal(JSON.parse(good.stdout).summary.candidateCount, 1);assert.equal(good.stderr, '');
  for (const bad of ['{PRIVATE', JSON.stringify({...fixture(),name:'PRIVATE'})]) {
    const result=run(bad);assert.equal(result.status,1);assert.equal(result.stdout,'');assert.ok(!result.stderr.includes('PRIVATE'));
  }
});
