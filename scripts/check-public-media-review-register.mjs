import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HUMAN_REVIEW_STATES = new Set([
  'PENDING_HUMAN_REVIEW',
  'REVIEWED_APPROVED',
  'REVIEWED_RESTRICTED',
  'BLOCKED',
]);
export const PROVENANCE_STATES = new Set(['DOCUMENTED', 'PARTIAL', 'UNKNOWN']);
export const CONSENT_STATES = new Set(['CONFIRMED', 'NOT_APPLICABLE', 'UNKNOWN', 'RESTRICTED']);

const forbiddenKeys = new Set([
  'driveId', 'beneficiaryName', 'patientName', 'documentUrl', 'privatePath',
  'consentDocument', 'identityNumber', 'bankAccount', 'medicalRecord',
]);

function assertState(value, allowed, label) {
  if (!allowed.has(value)) throw new Error(`${label} has unsupported value ${JSON.stringify(value)}`);
}

function scanForbiddenKeys(value, location = 'register') {
  if (!value || typeof value !== 'object') return;
  for (const [key, nested] of Object.entries(value)) {
    if (forbiddenKeys.has(key)) {
      throw new Error(`${location} contains forbidden sensitive-detail field ${key}`);
    }
    scanForbiddenKeys(nested, `${location}.${key}`);
  }
}

export async function listPublicMediaFiles(root) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join('/'));
    }
  }
  await walk(root);
  return files.sort();
}

export function validatePublicMediaReviewRegister(register, assetPaths) {
  if (register?.version !== 1) throw new Error('Public media review register must use version 1.');
  if (!Array.isArray(register.groups) || register.groups.length === 0) throw new Error('Review register requires at least one coverage group.');
  if (!Array.isArray(register.overrides)) throw new Error('Review register overrides must be an array.');
  scanForbiddenKeys(register);

  const groupIds = new Set();
  const groups = register.groups.map((group, index) => {
    if (!group.id || groupIds.has(group.id)) throw new Error(`Coverage group ${index + 1} needs a unique id.`);
    groupIds.add(group.id);
    let matcher;
    try { matcher = new RegExp(group.pattern); } catch { throw new Error(`Coverage group ${group.id} has an invalid pattern.`); }
    assertState(group.humanReview, HUMAN_REVIEW_STATES, `Coverage group ${group.id} humanReview`);
    assertState(group.provenance, PROVENANCE_STATES, `Coverage group ${group.id} provenance`);
    assertState(group.consent, CONSENT_STATES, `Coverage group ${group.id} consent`);
    return { ...group, matcher };
  });

  const assets = new Set(assetPaths);
  const overrideByPath = new Map();
  for (const override of register.overrides) {
    if (!override.path || overrideByPath.has(override.path)) throw new Error(`Duplicate or empty override path ${JSON.stringify(override.path)}.`);
    if (!assets.has(override.path)) throw new Error(`Review override points to missing public media path ${override.path}.`);
    assertState(override.humanReview, HUMAN_REVIEW_STATES, `Override ${override.path} humanReview`);
    assertState(override.provenance, PROVENANCE_STATES, `Override ${override.path} provenance`);
    assertState(override.consent, CONSENT_STATES, `Override ${override.path} consent`);
    if (override.sensitiveContext !== undefined && typeof override.sensitiveContext !== 'boolean') {
      throw new Error(`Override ${override.path} sensitiveContext must be boolean when provided.`);
    }
    overrideByPath.set(override.path, override);
  }

  const resolved = [];
  for (const assetPath of assetPaths) {
    const matchingGroups = groups.filter(group => group.matcher.test(assetPath));
    if (matchingGroups.length !== 1) {
      throw new Error(`${assetPath} must match exactly one review coverage group; matched ${matchingGroups.map(group => group.id).join(', ') || 'none'}.`);
    }
    const group = matchingGroups[0];
    const override = overrideByPath.get(assetPath);
    const decision = {
      path: assetPath,
      groupId: group.id,
      sensitiveContext: override?.sensitiveContext ?? Boolean(group.sensitiveContext),
      humanReview: override?.humanReview ?? group.humanReview,
      provenance: override?.provenance ?? group.provenance,
      consent: override?.consent ?? group.consent,
      reviewedAt: override?.reviewedAt ?? group.reviewedAt ?? null,
      reviewedBy: override?.reviewedBy ?? group.reviewedBy ?? null,
      provenanceReference: override?.provenanceReference ?? group.provenanceReference ?? null,
    };

    if (decision.humanReview === 'REVIEWED_APPROVED') {
      if (!decision.reviewedAt || !decision.reviewedBy) throw new Error(`${assetPath} claims REVIEWED_APPROVED without reviewer and review date.`);
      if (decision.provenance !== 'DOCUMENTED') throw new Error(`${assetPath} cannot be REVIEWED_APPROVED without documented provenance.`);
      if (!['CONFIRMED', 'NOT_APPLICABLE'].includes(decision.consent)) throw new Error(`${assetPath} cannot be REVIEWED_APPROVED with consent=${decision.consent}.`);
      if (decision.sensitiveContext && decision.consent !== 'CONFIRMED') throw new Error(`${assetPath} is sensitive-context media and requires confirmed consent for REVIEWED_APPROVED status.`);
    }
    resolved.push(decision);
  }

  return resolved;
}

export function publicMediaReviewSummary(resolved) {
  const count = value => resolved.filter(item => item.humanReview === value).length;
  return {
    total: resolved.length,
    approved: count('REVIEWED_APPROVED'),
    restricted: count('REVIEWED_RESTRICTED'),
    pending: count('PENDING_HUMAN_REVIEW'),
    blocked: count('BLOCKED'),
    documentedProvenance: resolved.filter(item => item.provenance === 'DOCUMENTED').length,
    unknownConsent: resolved.filter(item => item.consent === 'UNKNOWN').length,
    sensitiveContext: resolved.filter(item => item.sensitiveContext).length,
  };
}

export async function loadAndValidatePublicMediaReviewRegister({ root = 'public/media', registerPath = 'docs/public-media-review-register.json' } = {}) {
  const [raw, assetPaths] = await Promise.all([
    readFile(registerPath, 'utf8'),
    listPublicMediaFiles(root),
  ]);
  const register = JSON.parse(raw);
  return validatePublicMediaReviewRegister(register, assetPaths);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const readiness = process.argv.includes('--readiness');
  loadAndValidatePublicMediaReviewRegister().then(resolved => {
    const summary = publicMediaReviewSummary(resolved);
    console.log(`Public media review coverage: ${summary.total} assets represented exactly once.`);
    console.log(`Human review: ${summary.approved} approved, ${summary.restricted} restricted, ${summary.pending} pending, ${summary.blocked} blocked.`);
    console.log(`Governance metadata: ${summary.documentedProvenance} with documented provenance; ${summary.unknownConsent} with consent still unknown; ${summary.sensitiveContext} default to sensitive-context review.`);
    console.log('Automated register coverage is not human privacy/consent approval.');
    if (readiness && (summary.pending || summary.blocked || summary.restricted)) {
      throw new Error(`Launch media review is not complete: ${summary.pending} pending, ${summary.restricted} restricted, ${summary.blocked} blocked.`);
    }
  }).catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
