import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { reviewCrossChannelCredits } from './cross-channel-credit-review.mjs';
const direct = (id, reference, amountPaise = 10000, day = '2026-11-26') => ({ id, reference, amountPaise, day });
const fixture = () => ({ version: 1, currency: 'INR', claims: [direct('c1','UTR001')], application: [{id:'a1',kind:'capture',reference:'PAY001',amountPaise:20000}], movements: [{id:'m1',settlementId:'s1',kind:'capture',reference:'PAY001',amountPaise:20000}], settlements: [{id:'s1',reference:'UTR002',amountPaise:20000}], credits: [direct('b1','UTR001'),direct('b2','UTR002',20000)] });
test('disjoint channels reconcile one shared bank pool without double counting', () => {
  const r = reviewCrossChannelCredits(fixture());
  assert.deepEqual(r.claims,[{id:'c1',outcome:'candidate',creditId:'b1'}]);
  assert.equal(r.settlements[0].creditId,'b2');
  assert.deepEqual(r.credits,[{id:'b1',outcome:'direct_candidate',claimId:'c1'},{id:'b2',outcome:'settlement_candidate',settlementId:'s1'}]);
  assert.deepEqual(r.summary,{creditCount:2,creditPaise:30000,directCandidateCount:1,directCandidatePaise:10000,settlementCandidateCount:1,settlementCandidatePaise:20000,exceptionCreditCount:0,exceptionCreditPaise:0,conflictCreditCount:0});
  assert.equal(r.authoritative,false); assert.ok(!/UTR001|UTR002|PAY001/.test(JSON.stringify(r)));
});
test('same bank reference in both channels quarantines both even when both independently match', () => {
  const f=fixture(); f.claims=[direct('c1','UTR002',20000)]; f.credits=[f.credits[1]];
  const r=reviewCrossChannelCredits(f);
  assert.equal(r.claims[0].outcome,'cross_channel_conflict'); assert.ok(!Object.hasOwn(r.claims[0],'creditId'));
  assert.equal(r.settlements[0].outcome,'exception'); assert.ok(r.settlements[0].issues.includes('cross_channel_conflict')); assert.ok(!Object.hasOwn(r.settlements[0],'creditId'));
  assert.deepEqual(r.credits,[{id:'b2',outcome:'cross_channel_conflict'}]);
  assert.equal(r.summary.directCandidatePaise+r.summary.settlementCandidatePaise,0); assert.equal(r.summary.exceptionCreditPaise,20000);
});
test('a conflicting reference cannot be cleared by an amount/date mismatch or missing credit',()=>{
  const f=fixture(); f.claims=[direct('c1','UTR002',19999,'2026-11-25')];
  let r=reviewCrossChannelCredits(f); assert.equal(r.claims[0].outcome,'cross_channel_conflict'); assert.equal(r.settlements[0].outcome,'exception');
  f.credits=[]; r=reviewCrossChannelCredits(f); assert.equal(r.claims[0].outcome,'cross_channel_conflict'); assert.ok(r.settlements[0].issues.includes('missing_bank_credit')); assert.ok(r.settlements[0].issues.includes('cross_channel_conflict'));
});
test('duplicates within bank feed, unclaimed credits and missing application data remain exceptions',()=>{
  const f=fixture(); f.credits.push(direct('b3','UTR001'),direct('b4','UTR004',99)); f.application=[];
  const r=reviewCrossChannelCredits(f); assert.equal(r.claims[0].outcome,'ambiguous_reference'); assert.ok(r.settlements[0].issues.includes('application_movement_mismatch'));
  assert.deepEqual(r.credits.map(c=>c.outcome),['ambiguous_reference','unmatched','ambiguous_reference','unmatched']); assert.equal(r.summary.exceptionCreditPaise,40099);
});
test('one malformed row or unknown private field refuses the whole batch',()=>{
  for(const change of [f=>f.credits[0].day='2026-02-30', f=>f.credits[0].name='PRIVATE',f=>f.movements[0].extra='PRIVATE',f=>f.currency='USD',f=>f.credits.push({...f.credits[0]}),f=>f.credits[0].amountPaise=Number.MAX_SAFE_INTEGER]){
    const f=fixture();change(f);assert.throws(()=>reviewCrossChannelCredits(f),e=>e instanceof Error&&!e.message.includes('PRIVATE'));
  }
});
test('empty batches are nonauthoritative and review does not mutate normalized data',()=>{
  const f=fixture(); const before=JSON.stringify(f); reviewCrossChannelCredits(f);assert.equal(JSON.stringify(f),before);
  const r=reviewCrossChannelCredits({version:1,currency:'INR',claims:[],application:[],movements:[],settlements:[],credits:[]}); assert.equal(r.authoritative,false); assert.equal(r.summary.creditCount,0);
});
test('10,000 mixed credits preserve exact conservation and unique candidate credit ids',()=>{
  const f={version:1,currency:'INR',claims:[],application:[],movements:[],settlements:[],credits:[]};
  for(let i=0;i<10000;i++){
    const ref='UTR'+String(i).padStart(6,'0'); f.credits.push(direct('b'+i,ref,101));
    if(i%2===0)f.claims.push(direct('c'+i,ref,101));
    if(i%2===1||i%10===0){ const payment='PAY'+String(i).padStart(6,'0'); f.application.push({id:'a'+i,kind:'capture',reference:payment,amountPaise:101}); f.movements.push({id:'m'+i,settlementId:'s'+i,kind:'capture',reference:payment,amountPaise:101});f.settlements.push({id:'s'+i,reference:ref,amountPaise:101}); }
  }
  const r=reviewCrossChannelCredits(f);assert.equal(r.summary.directCandidateCount,4000);assert.equal(r.summary.settlementCandidateCount,5000);assert.equal(r.summary.conflictCreditCount,1000); assert.equal(r.summary.directCandidatePaise+r.summary.settlementCandidatePaise+r.summary.exceptionCreditPaise,r.summary.creditPaise);
  const ids=[...r.claims,...r.settlements].filter(x=>x.outcome==='candidate').map(x=>x.creditId); assert.equal(new Set(ids).size,9000);
});
test('CLI refuses malformed or private input without echoing it',()=>{
  const path=fileURLToPath(new URL('./cross-channel-credit-review.mjs',import.meta.url));
  const run=input=>spawnSync(process.execPath,[path],{input,encoding:'utf8'});
  const good=run(JSON.stringify(fixture()));assert.equal(good.status,0);assert.equal(JSON.parse(good.stdout).summary.creditPaise,30000);assert.equal(good.stderr,'');
  for(const input of ['{PRIVATE',JSON.stringify({...fixture(),name:'PRIVATE'})]){const bad=run(input);assert.equal(bad.status,1);assert.equal(bad.stdout,'');assert.ok(!bad.stderr.includes('PRIVATE'));}
});
