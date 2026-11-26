// Unpublished synthetic capacity model. Not a payment, allocation or persistence API.
const programmes = new Set(['qaida', 'nazira', 'hifdh-day-scholar']);
const terms = new Set([1, 3, 6, 12]);
const states = new Set(['held', 'committed', 'released']);
const fields = ['id', 'programme', 'startMonth', 'months', 'units', 'expiresAt'];
const exact = (v, keys) => v !== null && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
const integer = (n, min, max = Number.MAX_SAFE_INTEGER) => Number.isSafeInteger(n) && n >= min && n <= max;
const monthIndex = v => typeof v === 'string' && /^[2-9]\d{3}-(0[1-9]|1[0-2])$/.test(v) ? Number(v.slice(0, 4)) * 12 + Number(v.slice(5)) - 1 : null;
const key = (programme, month) => `${programme}:${month}`;
const valid = (r, extra = []) => exact(r, [...fields, ...extra]) && typeof r.id === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(r.id) && programmes.has(r.programme) && monthIndex(r.startMonth) !== null && terms.has(r.months) && monthIndex(r.startMonth) + r.months <= 10000 * 12 && integer(r.units, 1, 50) && integer(r.expiresAt, 1);
const monthKeys = r => Array.from({ length: r.months }, (_, i) => key(r.programme, monthIndex(r.startMonth) + i));
const result = outcome => ({ outcome });

export function evaluateHold(input) {
  if (!exact(input, ['capacities', 'reservations', 'request', 'now']) || !integer(input.now, 0) || !valid(input.request) || input.request.expiresAt <= input.now) return result('invalid_request');
  const { capacities, reservations, request, now } = input;
  if (!Array.isArray(capacities) || !Array.isArray(reservations) || capacities.length > 100000 || reservations.length > 100000) return result('invalid_inventory');
  const remaining = new Map();
  for (const c of capacities) {
    if (!exact(c, ['programme', 'month', 'units']) || !programmes.has(c.programme) || monthIndex(c.month) === null || !integer(c.units, 0)) return result('invalid_inventory');
    const k = key(c.programme, monthIndex(c.month));
    if (remaining.has(k)) return result('invalid_inventory');
    remaining.set(k, c.units);
  }
  const ids = new Map();
  for (const row of reservations) {
    if (!valid(row, ['state']) || !states.has(row.state) || ids.has(row.id)) return result('invalid_inventory');
    ids.set(row.id, row);
    if (row.state === 'released' || (row.state === 'held' && row.expiresAt <= now)) continue;
    for (const k of monthKeys(row)) {
      const free = remaining.get(k);
      if (free === undefined || free < row.units) return result('invalid_inventory');
      remaining.set(k, free - row.units);
    }
  }
  const prior = ids.get(request.id);
  if (prior) {
    if (!fields.every(field => prior[field] === request[field]) || prior.state === 'released') return result('id_conflict');
    return result(prior.state === 'committed' ? 'already_committed' : 'already_held');
  }
  const free = monthKeys(request).map(k => remaining.get(k));
  if (free.some(n => n === undefined)) return result('capacity_unknown');
  const minimumRemaining = Math.min(...free);
  return { outcome: minimumRemaining >= request.units ? 'candidate' : 'insufficient_capacity', minimumRemaining };
}
