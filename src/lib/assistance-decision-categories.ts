const categories = ["MEDICAL", "EDUCATION", "LIVELIHOOD", "FOOD_HARDSHIP", "HOUSING", "EMERGENCY", "OTHER"] as const;
export const decisionReportFields = ["received", "recorded", "withinDay", "withinWeek", "overWeek", "openWithoutDecision", "otherWithoutDecision",
  "verificationRecorded", "verificationWithinDay", "verificationWithinWeek", "verificationOverWeek", "verificationMissing"] as const;
export type AssistanceDecisionReport = Record<(typeof decisionReportFields)[number], number>;
export type DecisionCategory = typeof categories[number];
export type DecisionCategoryRow = { category: DecisionCategory } & AssistanceDecisionReport;
export type DecisionCategoryBreakdown = { totals: AssistanceDecisionReport; categories: DecisionCategoryRow[] };
export type RawDecisionCategory = { category: string } & Record<(typeof decisionReportFields)[number], bigint>;
const fail = () => { throw new Error("Inconsistent assistance decision report"); };
const empty = () => Object.fromEntries(decisionReportFields.map(field => [field, 0])) as AssistanceDecisionReport;

function valid(report: AssistanceDecisionReport) {
  return decisionReportFields.every(field => Number.isSafeInteger(report[field]) && report[field] >= 0) &&
    report.recorded === report.withinDay + report.withinWeek + report.overWeek &&
    report.received === report.recorded + report.openWithoutDecision + report.otherWithoutDecision &&
    report.verificationRecorded === report.verificationWithinDay + report.verificationWithinWeek + report.verificationOverWeek &&
    report.received === report.verificationRecorded + report.verificationMissing;
}

/** One row per known category, without case identity. Reject malformed or inconsistent aggregates. */
export function summarizeDecisionCategories(rows: readonly RawDecisionCategory[]): DecisionCategoryBreakdown {
  const totals = empty();
  const byCategory = new Map<DecisionCategory, DecisionCategoryRow>();
  for (const row of rows) {
    const category = categories.find(value => value === row.category);
    if (!category || byCategory.has(category)) return fail();
    if (decisionReportFields.some(field => typeof row[field] !== "bigint")) return fail();
    const report = Object.fromEntries(decisionReportFields.map(field => [field, Number(row[field])])) as AssistanceDecisionReport;
    if (!valid(report) || report.received === 0) return fail();
    byCategory.set(category, { category, ...report });
    for (const field of decisionReportFields) totals[field] += report[field];
  }
  if (!valid(totals)) return fail();
  return { totals, categories: categories.flatMap(category => {
    const row = byCategory.get(category);
    return row ? [row] : [];
  }) };
}
