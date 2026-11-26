import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { compareMigrationInventory } from './railway-iac-parity.mjs';

// Dated review target. Refresh from the authenticated deployment details if
// production identity changes. Never manufacture the missing manifest fields.
const deploymentId = '9d84359f-60d8-479a-be8a-ebc6c85ebfab';
const commitSha = '7619d3335f5a710ee5ffa044e475ebbd2b36103a';
const baseline = JSON.parse(readFileSync(new URL('./railway-iac-observed-2026-11-26.json', import.meta.url), 'utf8'));
const legacy = JSON.parse(readFileSync(new URL('../railway.json', import.meta.url), 'utf8'));
const expected = {
  deploymentId, commitSha,
  builder: legacy.build.builder, dockerfilePath: legacy.build.dockerfilePath,
  healthcheckPath: legacy.deploy.healthcheckPath, healthcheckTimeout: legacy.deploy.healthcheckTimeout,
  restartPolicyType: legacy.deploy.restartPolicyType, restartPolicyMaxRetries: legacy.deploy.restartPolicyMaxRetries,
};
const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const finding = (code, message) => ({ code, message });

// Both inputs are manually normalized, non-secret review documents. This is
// not a provider plan parser, authentication mechanism, or permission to apply.
export function compareDeploymentParity(evidence, candidate) {
  if (!isDeepStrictEqual(evidence, expected)) return [finding('deployment-evidence', 'Exact reviewed deployment settings are absent or differ; inspect deployment details before migration')];
  if (!record(candidate) || !record(candidate.website)) return [finding('invalid-inventory', 'Expected normalized candidate inventory')];
  const projected = structuredClone(candidate);
  const target = structuredClone(baseline);
  for (const field of ['builder', 'healthcheckPath', 'healthcheckTimeout', 'restartPolicyMaxRetries']) target.website[field] = expected[field];
  const issues = [];
  const additional = { dockerfilePath: expected.dockerfilePath, restartPolicyType: expected.restartPolicyType, preDeployTimeoutSeconds: 300 };
  for (const [field, value] of Object.entries(additional)) {
    if (!Object.hasOwn(projected.website, field) || !isDeepStrictEqual(projected.website[field], value)) issues.push(finding('website.' + field, 'Website deployment setting differs from reviewed target'));
    delete projected.website[field];
  }
  // Existing guard checks inventory, stored non-overridden website fields and
  // auxiliary service boundaries. Do not print its untrusted unknown key names.
  for (const issue of compareMigrationInventory(target, projected)) {
    issues.push(issue.code === 'unexpected-fields' ? finding('unexpected-fields', 'Unexpected fields in normalized inventory') : issue);
  }
  return issues;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 4) {
    console.error('Usage: node scripts/railway-iac-deployment-parity.mjs <reviewed-deployment.json> <normalized-plan-target.json>');
    process.exitCode = 2;
  } else {
    try {
      const evidence = JSON.parse(readFileSync(process.argv[2], 'utf8'));
      const candidate = JSON.parse(readFileSync(process.argv[3], 'utf8'));
      const issues = compareDeploymentParity(evidence, candidate);
      if (issues.length) {
        for (const issue of issues) console.error(issue.code + ': ' + issue.message);
        process.exitCode = 1;
      } else {
        console.log('Offline deployment parity OK for the dated review target. Fresh authenticated inventory, resource identities, real plan and separate approval are still required.');
      }
    } catch {
      console.error('Unable to read or validate sanitized inputs.');
      process.exitCode = 2;
    }
  }
}
