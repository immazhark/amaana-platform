import assert from 'node:assert/strict';
import { test } from 'node:test';
import { compareIdentityParity } from './railway-iac-identity-parity.mjs';

const inventory = () => ({
  projectId: 'synthetic-project', environmentId: 'synthetic-production',
  staged: false,
  services: [{ id: 'synthetic-website', variableNames: ['DB_URL', 'MEDIA_KEY'] }, { id: 'synthetic-worker', variableNames: ['WORKER_KEY'] }],
  buckets: ['synthetic-bucket-a', 'synthetic-bucket-b'], volumes: [], sharedVariableNames: ['SHARED_KEY'],
});
const codes = (a,b) => compareIdentityParity(a,b).map(x=>x.code);
test('identical identities and variable names pass independently of order', () => {
  const a=inventory(), b=inventory(); b.services.reverse(); b.buckets.reverse(); b.services[1].variableNames.reverse();
  assert.deepEqual(compareIdentityParity(a,b), []);
});
test('same resource counts cannot conceal replacement of a service, bucket or volume', () => {
  const a=inventory(); a.volumes=['synthetic-volume-a'];
  for (const [field,mutate] of [['services',b=>b.services[0].id='replacement'],['buckets',b=>b.buckets[0]='replacement'],['volumes',b=>b.volumes[0]='replacement']]) {
    const b=structuredClone(a); mutate(b); assert.ok(codes(a,b).includes(field+'-identity'));
  }
});
test('same variable counts cannot conceal missing, renamed or relocated variables', () => {
  const a=inventory(); const b=inventory(); [b.services[0].variableNames[0],b.services[1].variableNames[0]]=[b.services[1].variableNames[0],b.services[0].variableNames[0]];
  assert.ok(codes(a,b).includes('service-variable-names'));
  const c=inventory(); c.sharedVariableNames=['REPLACED']; assert.ok(codes(a,c).includes('shared-variable-names'));
});
test('wrong environment, staged changes, duplicates and malformed inventories fail closed', () => {
  for (const mutate of [b=>b.projectId='wrong',b=>b.environmentId='wrong',b=>b.staged=true,b=>b.buckets.push(b.buckets[0]),b=>b.services.push(structuredClone(b.services[0])),b=>b.services[0].variableNames.push('DB_URL'),b=>delete b.sharedVariableNames,b=>b.volumes=[null],b=>b.buckets=[]]) {
    const a=inventory(),b=inventory();mutate(b);assert.ok(compareIdentityParity(a,b).length>0);
  }
  assert.ok(compareIdentityParity({},{}).length>0);
});
test('unknown fields including values fail without echoing private names, IDs or values', () => {
  const a=inventory(),b=inventory(); b.services[0]['synthetic-private-field']='synthetic-private-value';
  const result=compareIdentityParity(a,b);assert.ok(result.length>0);assert.doesNotMatch(JSON.stringify(result),/synthetic-private|synthetic-website|DB_URL/);
  const c=inventory();c.buckets[0]='synthetic-private-bucket';assert.doesNotMatch(JSON.stringify(compareIdentityParity(a,c)),/synthetic-private|synthetic-bucket/);
});
