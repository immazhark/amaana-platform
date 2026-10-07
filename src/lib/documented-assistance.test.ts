import { describe, expect, it } from 'vitest';
import { programmes } from '@/lib/master-copy';
import { documentedAssistanceTotal } from './documented-assistance';

const cases = programmes.filter(record => record.causeSlug === 'medical-financial-relief');
const firstCase = firstCase;
if (!firstCase) throw new Error('Expected at least one canonical medical/financial case fixture.');

describe('documented assistance total', () => {
  it('derives the six factual-locked case amounts from canonical content', () => {
    expect(documentedAssistanceTotal()).toBe(1_214_520);
  });
  it('ignores future rollups and unrelated measures', () => {
    expect(documentedAssistanceTotal([...cases, { slug: 'relief-programme-total', causeSlug: 'medical-financial-relief', primaryMetric: '₹12,14,520' }])).toBe(1_214_520);
  });
  it('fails closed for missing or repeated cases', () => {
    expect(documentedAssistanceTotal(cases.slice(1))).toBeNull();
    expect(documentedAssistanceTotal([...cases, firstCase])).toBeNull();
  });
  it.each(['95,000 families', '₹95,000–₹1,00,000', '₹95,00', '₹0', '₹9007199254740992', null])('rejects an invalid case metric: %s', primaryMetric => {
    expect(documentedAssistanceTotal([{ ...firstCase, primaryMetric }, ...cases.slice(1)])).toBeNull();
  });
  it('accepts an entire amount using Indian digit grouping', () => {
    expect(documentedAssistanceTotal([{ ...firstCase, primaryMetric: '₹1,00,000' }, ...cases.slice(1)])).toBe(1_219_520);
  });
});
