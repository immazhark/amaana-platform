import { programmes } from '@/lib/master-copy';

// Explicit case scope prevents future programme rollups from being counted twice.
const documentedCases = new Set([
  'auto-rickshaw-livelihood-support',
  'emergency-neonatal-medical-aid',
  'oral-cancer-surgery-support',
  'aliza-critical-care-support',
  'severe-burn-treatment-support',
  'jewellery-loan-intervention',
]);

type CaseMetric = { slug: string; causeSlug: string; primaryMetric?: string | null };

export function documentedAssistanceTotal(records: readonly CaseMetric[] = programmes): number | null {
  const seen = new Set<string>();
  let total = 0;
  for (const record of records) {
    if (!documentedCases.has(record.slug)) continue;
    if (seen.has(record.slug) || record.causeSlug !== 'medical-financial-relief') return null;
    const metric = record.primaryMetric?.trim() ?? '';
    // Only an entire rupee amount is accepted; counts, ranges and prose are not amounts.
    if (!/^₹\s*(?:[1-9]\d*|[1-9]\d{0,2}(?:,\d{3})+|[1-9]\d?(?:,\d{2})*,\d{3})$/.test(metric)) return null;
    const amount = Number(metric.replace(/[₹,\s]/g, ''));
    if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(total + amount)) return null;
    total += amount;
    seen.add(record.slug);
  }
  return seen.size === documentedCases.size ? total : null;
}
