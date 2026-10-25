import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Offline comparison only. Does not contact Railway or apply changes.
const fields = [
  'repository', 'branch', 'builder', 'watchPatterns', 'healthcheckPath',
  'healthcheckTimeout', 'preDeployCommand', 'restartPolicyMaxRetries',
  'sleepApplication', 'regionReplicas',
];
const allowedRoot = new Set(['capturedAt', 'environment', 'serviceNames', 'bucketCount', 'volumeCount', 'website']);
const allowedWebsite = new Set(fields);
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const stableEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function serviceNamesEqual(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) ||
      a.some(x => typeof x !== 'string') || b.some(x => typeof x !== 'string') ||
      new Set(a).size !== a.length || new Set(b).size !== b.length) return false;
  return stableEqual([...a].sort(), [...b].sort());
}

export function compareMigrationInventory(reference, candidate) {
  if (!isRecord(reference) || !isRecord(candidate)) {
    return [{ code: 'invalid-inventory', message: 'Both inventories must be non-null objects' }];
  }
  const issues = [];
  const issue = (code, message) => issues.push({ code, message });
  const unknown = Object.keys(candidate).filter(key => !allowedRoot.has(key));
  if (unknown.length) issue('unexpected-fields', 'Unexpected top-level fields: ' + unknown.join(', '));
  if (candidate.environment !== reference.environment) issue('environment', 'Wrong target environment');
  if (!serviceNamesEqual(reference.serviceNames, candidate.serviceNames)) {
    issue('service-inventory', 'Service names differ, are missing, or repeat');
  }
  for (const [field, code] of [['bucketCount', 'bucket-inventory'], ['volumeCount', 'volume-inventory']]) {
    if (!Number.isSafeInteger(candidate[field]) || candidate[field] < 0 || candidate[field] !== reference[field]) {
      issue(code, field + ' differs from the reference');
    }
  }
  const expected = isRecord(reference.website) ? reference.website : {};
  const actual = isRecord(candidate.website) ? candidate.website : {};
  const unexpectedWebsite = Object.keys(actual).filter(key => !allowedWebsite.has(key));
  if (unexpectedWebsite.length) issue('unexpected-fields', 'Unexpected website fields: ' + unexpectedWebsite.join(', '));
  for (const field of fields) {
    if (!Object.hasOwn(actual, field) || !stableEqual(actual[field], expected[field])) {
      issue('website.' + field, 'Website ' + field + ' differs from observed live configuration');
    }
  }
  return issues;
}

// A manually sanitized candidate can be checked against the dated reference.
// This is NOT an IaC plan or a check of Railway's latest live state.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const proposalPath = process.argv[2];
  if (!proposalPath || process.argv.length !== 3) {
    console.error('Usage: node scripts/railway-iac-parity.mjs <sanitized-candidate.json>');
    process.exitCode = 2;
  } else {
    try {
      const baseline = JSON.parse(readFileSync(new URL('./railway-iac-observed-2026-10-25.json', import.meta.url), 'utf8'));
      const proposal = JSON.parse(readFileSync(proposalPath, 'utf8'));
      const issues = compareMigrationInventory(baseline, proposal);
      if (issues.length) {
        for (const finding of issues) console.error(finding.code + ': ' + finding.message);
        process.exitCode = 1;
      } else {
        console.log('Offline parity OK against dated baseline; live Railway config plan is still required.');
      }
    } catch (error) {
      console.error('Unable to read or validate sanitized proposal:', error.code || 'INVALID_JSON');
      process.exitCode = 2;
    }
  }
}
