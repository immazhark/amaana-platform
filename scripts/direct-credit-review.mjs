import { pathToFileURL } from 'node:url';

// Offline, read-only review of minimized direct-transfer claims and independently supplied INR bank credits.
// Exact matches are candidates only. No provider calls, approval, settlement assertion or record mutations.
const MAX_ROWS = 100_000;
const keys = (value, fields) => value !== null && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === fields.length && fields.every(field => Object.hasOwn(value, field));
const validDay = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
function checkedAdd(a, b) {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) throw new Error('Batch amount exceeds safe integer paise range');
  return sum;
}
function indexRows(rows, side) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new Error(`Invalid ${side} row collection`);
  const ids = new Set();
  const refs = new Map();
  let total = 0;
  for (const [i, row] of rows.entries()) {
    if (!keys(row, ['id', 'reference', 'amountPaise', 'day']) ||
        typeof row.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(row.id) || ids.has(row.id) ||
        typeof row.reference !== 'string' || !/^[A-Za-z0-9._/-]{6,100}$/.test(row.reference) ||
        !Number.isSafeInteger(row.amountPaise) || row.amountPaise <= 0 || !validDay(row.day)) {
      // Never echo untrusted fields, transaction references or amounts in diagnostics.
      throw new Error(`Invalid ${side} row at position ${i + 1}`);
    }
    ids.add(row.id);
    total = checkedAdd(total, row.amountPaise);
    const entry = refs.get(row.reference);
    if (entry) entry.count += 1;
    else refs.set(row.reference, { count: 1, row });
  }
  return { refs, total };
}
function outcome(row, own, other, missing, counterpartKey) {
  const a = own.get(row.reference);
  const b = other.get(row.reference);
  if (a.count > 1 || (b && b.count > 1)) return { id: row.id, outcome: 'ambiguous_reference' };
  if (!b) return { id: row.id, outcome: missing };
  if (row.amountPaise !== b.row.amountPaise) return { id: row.id, outcome: 'amount_mismatch' };
  if (row.day !== b.row.day) return { id: row.id, outcome: 'date_mismatch' };
  return { id: row.id, outcome: 'candidate', [counterpartKey]: b.row.id };
}
export function reviewDirectCredits(input) {
  if (!keys(input, ['version', 'currency', 'claims', 'credits']) || input.version !== 1 || input.currency !== 'INR') {
    throw new Error('Expected version 1 minimized INR review batch');
  }
  const claims = indexRows(input.claims, 'claim');
  const credits = indexRows(input.credits, 'credit');
  const claimResults = input.claims.map(row => outcome(row, claims.refs, credits.refs, 'no_credit', 'creditId'));
  const creditResults = input.credits.map(row => outcome(row, credits.refs, claims.refs, 'unclaimed', 'claimId'));
  let candidateCount = 0;
  let candidatePaise = 0;
  for (const [i, result] of claimResults.entries()) {
    if (result.outcome !== 'candidate') continue;
    candidateCount += 1;
    candidatePaise = checkedAdd(candidatePaise, input.claims[i].amountPaise);
  }
  return { version: 1, currency: 'INR', authoritative: false, claims: claimResults, credits: creditResults,
    summary: { claimCount: claimResults.length, creditCount: creditResults.length, candidateCount, candidatePaise,
      claimPaise: claims.total, creditPaise: credits.total, claimExceptionPaise: claims.total - candidatePaise,
      creditExceptionPaise: credits.total - candidatePaise } };
}

// CLI accepts only a normalized JSON batch on stdin; never logs the input or writes a file.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const chunks = [];
    let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 32 * 1024 * 1024) throw new Error('Input too large');
      chunks.push(chunk);
    }
    const report = reviewDirectCredits(JSON.parse(Buffer.concat(chunks).toString('utf8')));
    process.stdout.write(JSON.stringify(report) + '\n');
  } catch {
    process.stderr.write('Direct-credit review refused: invalid or oversized normalized INR batch.\n');
    process.exitCode = 1;
  }
}
