import { pathToFileURL } from 'node:url';

// Offline normalized review only: amounts are supplied, never inferred from a fee rate.
const LIMIT = 100_000;
const APP = new Set(['capture', 'refund']);
const KINDS = new Set([...APP, 'fee', 'tax', 'adjustment_credit', 'adjustment_debit']);
const exact = (v, fields) => v !== null && typeof v === 'object' && !Array.isArray(v) &&
  Object.keys(v).length === fields.length && fields.every(k => Object.hasOwn(v, k));
const id = v => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v);
const ref = v => typeof v === 'string' && /^[A-Za-z0-9._/-]{6,100}$/.test(v);
const amount = v => Number.isSafeInteger(v) && v > 0;
const add = (a, b) => {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new Error('Unsafe aggregate amount');
  return sum;
};
const appKey = r => `${r.kind}:${r.reference}`;
function validate(rows, name, fields, predicate) {
  if (!Array.isArray(rows) || rows.length > LIMIT) throw new Error(`Invalid ${name} collection`);
  const ids = new Set();
  let total = 0;
  for (const [i, row] of rows.entries()) {
    if (!exact(row, fields) || !id(row.id) || ids.has(row.id) || !amount(row.amountPaise) || !predicate(row)) {
      throw new Error(`Invalid ${name} row ${i + 1}`);
    }
    ids.add(row.id);
    total = add(total, row.amountPaise);
  }
}
function index(rows, key) {
  const map = new Map();
  for (const row of rows) {
    const k = key(row);
    const entry = map.get(k);
    if (entry) entry.count++;
    else map.set(k, { count: 1, row });
  }
  return map;
}
const uniqueMatch = (a, b, row) => a?.count === 1 && b?.count === 1 && b.row.amountPaise === row.amountPaise;
// Internal report projection over already validated inputs. Capture and refund remain separate
// positive whole-payment amounts; these buckets are not bank credit or donation principal.
export function applicationEvidenceReport(application, matchedSettlementById, settlements) {
  const outcomeBySettlement = new Map(settlements.map(row => [row.id, row.outcome]));
  const empty = () => ({ count: 0, amountPaise: 0 });
  const partition = () => ({ total: empty(), candidate_settlement: empty(), exception_settlement: empty(), unmatched_movement: empty() });
  const applicationSummary = { capture: partition(), refund: partition() };
  const include = (bucket, amountPaise) => {
    bucket.count++;
    bucket.amountPaise = add(bucket.amountPaise, amountPaise);
  };
  const applicationEvidence = application.map(({ id, kind, amountPaise }) => {
    const settlementId = matchedSettlementById.get(id);
    let outcome = 'unmatched_movement';
    if (settlementId !== undefined) {
      const state = outcomeBySettlement.get(settlementId);
      if (state !== 'candidate' && state !== 'exception') throw new Error('Inconsistent application settlement evidence');
      outcome = state === 'candidate' ? 'candidate_settlement' : 'exception_settlement';
    }
    const summary = applicationSummary[kind];
    include(summary.total, amountPaise);
    include(summary[outcome], amountPaise);
    return { id, kind, amountPaise, outcome, ...(settlementId !== undefined ? { settlementId } : {}) };
  });
  return { applicationEvidence, applicationSummary };
}

export function reviewSettlements(input) {
  if (!exact(input, ['version', 'currency', 'application', 'movements', 'settlements', 'credits']) || input.version !== 1 || input.currency !== 'INR') {
    throw new Error('Expected normalized version 1 INR settlement batch');
  }
  validate(input.application, 'application', ['id', 'kind', 'reference', 'amountPaise'], r => APP.has(r.kind) && ref(r.reference));
  validate(input.movements, 'movement', ['id', 'settlementId', 'kind', 'reference', 'amountPaise'], r => id(r.settlementId) && KINDS.has(r.kind) && (APP.has(r.kind) ? ref(r.reference) : r.reference === null));
  for (const name of ['settlements', 'credits']) validate(input[name], name, ['id', 'reference', 'amountPaise'], r => ref(r.reference));
  const application = index(input.application, appKey);
  const provider = index(input.movements.filter(r => APP.has(r.kind)), appKey);
  const payouts = index(input.settlements, r => r.reference);
  const credits = index(input.credits, r => r.reference);
  const groups = new Map(input.settlements.map(r => [r.id, { count: 0, net: 0, mismatch: false, adjustment: false }]));
  const represented = new Map();
  const candidateCredits = new Set();
  const unlinkedMovementIds = [];
  for (const row of input.movements) {
    const group = groups.get(row.settlementId);
    if (!group) { unlinkedMovementIds.push(row.id); continue; }
    group.count++;
    group.net = add(group.net, row.kind === 'capture' || row.kind === 'adjustment_credit' ? row.amountPaise : -row.amountPaise);
    if (APP.has(row.kind)) {
      const key = appKey(row);
      const local = application.get(key);
      if (uniqueMatch(provider.get(key), local, row)) represented.set(local.row.id, row.settlementId);
      else group.mismatch = true;
    }
    if (row.kind.startsWith('adjustment_')) group.adjustment = true;
  }
  let candidatePaise = 0;
  let candidateCount = 0;
  const settlements = input.settlements.map(row => {
    const group = groups.get(row.id);
    const bank = credits.get(row.reference);
    const issues = [];
    if (!group.count) issues.push('missing_movements');
    if (group.mismatch) issues.push('application_movement_mismatch');
    if (group.net !== row.amountPaise) issues.push('settlement_total_mismatch');
    if (group.adjustment) issues.push('adjustment_review_required');
    if (payouts.get(row.reference).count !== 1 || (bank && bank.count !== 1)) issues.push('ambiguous_bank_reference');
    else if (!bank) issues.push('missing_bank_credit');
    else if (bank.row.amountPaise !== row.amountPaise) issues.push('bank_amount_mismatch');
    const candidate = issues.length === 0;
    if (candidate) {
      candidatePaise = add(candidatePaise, row.amountPaise);
      candidateCount++;
      candidateCredits.add(bank.row.id);
    }
    return { id: row.id, outcome: candidate ? 'candidate' : 'exception', issues,
      movementNetPaise: group.net, declaredPaise: row.amountPaise, ...(candidate ? { creditId: bank.row.id } : {}) };
  });
  return { version: 1, currency: 'INR', authoritative: false, settlements, unlinkedMovementIds,
    unmatchedApplicationIds: input.application.filter(row => !represented.has(row.id)).map(row => row.id),
    unmatchedCreditIds: input.credits.filter(row => !candidateCredits.has(row.id)).map(row => row.id),
    ...applicationEvidenceReport(input.application, represented, settlements),
    summary: { settlementCount: settlements.length, candidateCount, candidatePaise } };
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
    process.stdout.write(JSON.stringify(reviewSettlements(JSON.parse(Buffer.concat(chunks).toString('utf8')))) + '\n');
  } catch {
    process.stderr.write('Settlement review refused: invalid or oversized normalized INR batch.\n');
    process.exitCode = 1;
  }
}
