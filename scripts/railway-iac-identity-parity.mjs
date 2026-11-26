import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const rootFields = ['projectId', 'environmentId', 'staged', 'services', 'buckets', 'volumes', 'sharedVariableNames'];
const serviceFields = ['id', 'variableNames'];
const isRecord = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const exactKeys = (x, keys) => isRecord(x) && Object.keys(x).length === keys.length && keys.every(k => Object.hasOwn(x,k));
const identifier = x => typeof x === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(x);
const names = x => typeof x === 'string' && /^[A-Za-z_][A-Za-z0-9_]{0,255}$/.test(x);
const unique = (x, predicate) => Array.isArray(x) && x.every(predicate) && new Set(x).size === x.length;
const sameSet = (a,b) => isDeepStrictEqual([...a].sort(), [...b].sort());
const valid = x => exactKeys(x,rootFields) && identifier(x.projectId) && identifier(x.environmentId) && x.staged === false &&
  Array.isArray(x.services) && x.services.length > 0 && x.services.every(s => exactKeys(s,serviceFields) && identifier(s.id) && unique(s.variableNames,names)) &&
  unique(x.services.map(s=>s.id),identifier) && unique(x.buckets,identifier) && unique(x.volumes,identifier) && unique(x.sharedVariableNames,names);

// Private, manually normalized inventories; neither values nor IDs are echoed.
// Name parity cannot prove that secret values or provider resource ownership are preserved.
export function compareIdentityParity(reference,candidate) {
  const issues = [];
  const issue = (code,message) => issues.push({code,message});
  if (!valid(reference) || !valid(candidate)) {
    issue('invalid-inventory','Malformed, non-exact or staged inventory; use unstaged private normalized inputs');
    return issues;
  }
  if (reference.projectId !== candidate.projectId || reference.environmentId !== candidate.environmentId) issue('target-identity','Project or environment identity differs');
  const referenceById = new Map(reference.services.map(s=>[s.id,s]));
  if (!sameSet(reference.services.map(s=>s.id),candidate.services.map(s=>s.id))) issue('services-identity','Service identities differ');
  if (!sameSet(reference.buckets,candidate.buckets)) issue('buckets-identity','Bucket identities differ');
  if (!sameSet(reference.volumes,candidate.volumes)) issue('volumes-identity','Volume identities differ');
  if (!sameSet(reference.sharedVariableNames,candidate.sharedVariableNames)) issue('shared-variable-names','Shared variable names differ');
  for (const service of candidate.services) {
    const previous = referenceById.get(service.id);
    if (previous && !sameSet(previous.variableNames,service.variableNames)) {
      issue('service-variable-names','Service variable names differ');
      break;
    }
  }
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) {
    console.error('Usage: node scripts/railway-iac-identity-parity.mjs <private-observed.json> <private-normalized-target.json>');
    process.exitCode = 2;
  } else {
    try {
      const issues = compareIdentityParity(JSON.parse(readFileSync(process.argv[2],'utf8')),JSON.parse(readFileSync(process.argv[3],'utf8')));
      if (issues.length) {
        for (const {code,message} of issues) console.error(code + ': ' + message);
        process.exitCode = 1;
      } else console.log('Offline identity and variable-name parity OK; provider plan, preserve semantics and authorization remain mandatory.');
    } catch {
      console.error('Unable to read or validate private inventories.');
      process.exitCode = 2;
    }
  }
}
