import { pathToFileURL } from 'node:url';
import { reviewDirectCredits } from './direct-credit-review.mjs';
import { applicationEvidenceReport, reviewSettlements } from './settlement-review.mjs';

// Offline only. Both channels must use the same normalized, independently scoped bank-credit feed.
const fields = ['version', 'currency', 'claims', 'application', 'movements', 'settlements', 'credits'];
const exact = (v, keys) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));

// Partition validated source amounts, not amounts from the other side of a match.
// Outcome buckets are exclusive; settlement issues themselves may overlap.
function partitionControlTotals(rows, results, outcomes, classify = row => row.outcome) {
  if (rows.length !== results.length) throw new Error('Inconsistent control-total rows');
  const empty = () => ({ count: 0, amountPaise: 0 });
  const total = empty();
  const byOutcome = Object.fromEntries(outcomes.map(outcome => [outcome, empty()]));
  const include = (bucket, amountPaise) => {
    bucket.count++;
    bucket.amountPaise += amountPaise;
    if (!Number.isSafeInteger(bucket.amountPaise)) throw new Error('Unsafe control total');
  };
  for (const [i, row] of rows.entries()) {
    const result = results[i];
    const outcome = classify(result);
    if (result.id !== row.id || !Object.hasOwn(byOutcome, outcome)) {
      throw new Error('Inconsistent control-total outcome');
    }
    include(total, row.amountPaise);
    include(byOutcome[outcome], row.amountPaise);
  }
  return { total, byOutcome };
}

export function reviewCrossChannelCredits(input) {
  if (!exact(input, fields) || input.version !== 1 || input.currency !== 'INR') {
    throw new Error('Expected version 1 shared INR credit review batch');
  }
  const { version, currency, claims, application, movements, settlements, credits } = input;
  // Existing validators check all rows, exact fields, unique IDs, dates and safe paise totals.
  const direct = reviewDirectCredits({ version, currency, claims, credits });
  const provider = reviewSettlements({ version, currency, application, movements, settlements,
    credits: credits.map(({ id, reference, amountPaise }) => ({ id, reference, amountPaise })) });

  // Quarantine overlaps even if a channel's candidate failed on amount, date or settlement evidence.
  const claimRefs = new Set(claims.map(row => row.reference));
  const conflicts = new Set(settlements.filter(row => claimRefs.has(row.reference)).map(row => row.reference));
  const bankRefCounts = new Map();
  for (const row of credits) bankRefCounts.set(row.reference, (bankRefCounts.get(row.reference) ?? 0) + 1);
  const creditMatches = new Map();
  const recordMatch = (creditId, match) => {
    if (creditMatches.has(creditId)) throw new Error('Inconsistent shared-credit candidate');
    creditMatches.set(creditId, match);
  };
  const claimResults = direct.claims.map((row, i) => {
    if (conflicts.has(claims[i].reference)) return { id: row.id, outcome: 'cross_channel_conflict' };
    if (row.outcome === 'candidate') recordMatch(row.creditId, { outcome: 'direct_candidate', claimId: row.id });
    return row;
  });
  const settlementResults = provider.settlements.map((row, i) => {
    if (conflicts.has(settlements[i].reference)) {
      return { id: row.id, outcome: 'exception', issues: [...row.issues, 'cross_channel_conflict'],
        movementNetPaise: row.movementNetPaise, declaredPaise: row.declaredPaise };
    }
    if (row.outcome === 'candidate') recordMatch(row.creditId, { outcome: 'settlement_candidate', settlementId: row.id });
    return row;
  });
  const summary = { creditCount: credits.length, creditPaise: direct.summary.creditPaise,
    directCandidateCount: 0, directCandidatePaise: 0, settlementCandidateCount: 0, settlementCandidatePaise: 0,
    exceptionCreditCount: 0, exceptionCreditPaise: 0, conflictCreditCount: 0 };
  const creditResults = credits.map(row => {
    const match = creditMatches.get(row.id);
    if (match?.outcome === 'direct_candidate') {
      summary.directCandidateCount++; summary.directCandidatePaise += row.amountPaise;
      return { id: row.id, ...match };
    }
    if (match?.outcome === 'settlement_candidate') {
      summary.settlementCandidateCount++; summary.settlementCandidatePaise += row.amountPaise;
      return { id: row.id, ...match };
    }
    summary.exceptionCreditCount++; summary.exceptionCreditPaise += row.amountPaise;
    if (conflicts.has(row.reference)) {
      summary.conflictCreditCount++;
      return { id: row.id, outcome: 'cross_channel_conflict' };
    }
    return { id: row.id, outcome: bankRefCounts.get(row.reference) > 1 ? 'ambiguous_reference' : 'unmatched' };
  });
  // Subsets of the validated positive bank total are safe integers. Check conservation explicitly.
  if (summary.directCandidatePaise + summary.settlementCandidatePaise + summary.exceptionCreditPaise !== summary.creditPaise ||
      summary.directCandidateCount + summary.settlementCandidateCount + summary.exceptionCreditCount !== summary.creditCount ||
      creditMatches.size !== summary.directCandidateCount + summary.settlementCandidateCount) {
    throw new Error('Inconsistent shared-credit totals');
  }
  const controlTotals = {
    claims: partitionControlTotals(claims, claimResults,
      ['candidate', 'cross_channel_conflict', 'ambiguous_reference', 'no_credit', 'amount_mismatch', 'date_mismatch']),
    settlements: partitionControlTotals(settlements, settlementResults,
      ['candidate', 'cross_channel_conflict', 'other_exception'], row => row.outcome === 'exception'
        ? (row.issues.includes('cross_channel_conflict') ? 'cross_channel_conflict' : 'other_exception') : row.outcome),
    credits: partitionControlTotals(credits, creditResults,
      ['direct_candidate', 'settlement_candidate', 'cross_channel_conflict', 'ambiguous_reference', 'unmatched']),
  };
  const claimCandidate = controlTotals.claims.byOutcome.candidate;
  const payoutCandidate = controlTotals.settlements.byOutcome.candidate;
  if (controlTotals.claims.total.amountPaise !== direct.summary.claimPaise ||
      controlTotals.credits.total.amountPaise !== summary.creditPaise ||
      claimCandidate.count !== summary.directCandidateCount || claimCandidate.amountPaise !== summary.directCandidatePaise ||
      payoutCandidate.count !== summary.settlementCandidateCount || payoutCandidate.amountPaise !== summary.settlementCandidatePaise) {
    throw new Error('Inconsistent shared-credit control totals');
  }
  // Reclassify against the final shared-credit decision, not the provider-only candidate.
  const matchedSettlementById = new Map(provider.applicationEvidence.filter(row => row.settlementId !== undefined).map(row => [row.id, row.settlementId]));
  return { version, currency, authoritative: false, claims: claimResults, settlements: settlementResults,
    credits: creditResults, unlinkedMovementIds: provider.unlinkedMovementIds,
    unmatchedApplicationIds: provider.unmatchedApplicationIds,
    ...applicationEvidenceReport(application, matchedSettlementById, settlementResults), summary, controlTotals };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 32 * 1024 * 1024) throw new Error('Input too large');
      chunks.push(chunk);
    }
    const report = reviewCrossChannelCredits(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    process.stdout.write(JSON.stringify(report) + '\n');
  } catch {
    process.stderr.write('Shared-credit review refused: invalid or oversized normalized INR batch.\n');
    process.exitCode = 1;
  }
}
