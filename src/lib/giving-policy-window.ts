/**
 * Offline-only General-purpose fund policy review window.
 *
 * A caller must supply an independently reviewed policy and a trusted
 * Asia/Kolkata local calendar date. This helper does not authorize a payment,
 * create a fund, provide a religious ruling, or check durable DB approvals.
 */

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" &&
    value.length > 0 &&
    value.trim() === value;
}

function validCalendarDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value;
}

/**
 * The effective start and through dates are inclusive *local governance days*,
 * not UTC timestamps. The backend must derive the review day in Asia/Kolkata.
 * Both fund and policy must explicitly allow GENERAL, and the policy must be
 * the fund's current approved version. No expired version is revived here.
 */
export function canReviewGeneralFundAtDate(
  source: unknown,
  asiaKolkataLocalDate: unknown,
): boolean {
  if (!validCalendarDate(asiaKolkataLocalDate)) return false;

  const input = asRecord(source);
  const fund = asRecord(input?.fund);
  const policy = asRecord(input?.policy);
  if (!input || !fund || !policy) return false;

  if (input.intent !== "GENERAL" ||
      !nonblank(fund.id) ||
      fund.status !== "ACTIVE" ||
      !nonblank(fund.currentPolicyVersionId) ||
      !Array.isArray(fund.eligibleIntents) ||
      !fund.eligibleIntents.includes("GENERAL")) {
    return false;
  }

  if (!nonblank(policy.id) ||
      !nonblank(policy.fundId) ||
      policy.status !== "ACTIVE" ||
      policy.id !== fund.currentPolicyVersionId ||
      policy.fundId !== fund.id ||
      !nonblank(policy.evidenceRef) ||
      !Array.isArray(policy.eligibleIntents) ||
      !policy.eligibleIntents.includes("GENERAL")) {
    return false;
  }

  if (!validCalendarDate(policy.effectiveFromDate) ||
      !validCalendarDate(policy.validThroughDate) ||
      policy.effectiveFromDate > policy.validThroughDate) {
    return false;
  }

  return asiaKolkataLocalDate >= policy.effectiveFromDate &&
    asiaKolkataLocalDate <= policy.validThroughDate;
}
