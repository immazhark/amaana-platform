/**
 * Offline-only business-effect classification for *already* server-verified
 * payment captures. The source marker is a typed assumption from an upstream
 * trusted verifier, not cryptographic verification or payment authorization.
 *
 * Never call this with untrusted browser data or use the disposition alone
 * to post money. All durable deduplication and exception handling must be
 * transactional, independently reviewed, and enforced by database uniqueness.
 */

export type CaptureDisposition =
  | "REJECT"
  | "CORRELATION_EXCEPTION"
  | "DUPLICATE_CAPTURE"
  | "EXCESS_CAPTURE_EXCEPTION"
  | "ELIGIBLE_FOR_POSTING";

const MAX_CAPTURE_PAISE = 100_000_000;
const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const PROVIDERS = new Set(["RAZORPAY", "CASHFREE"]);
const ENVIRONMENTS = new Set(["TEST", "LIVE"]);

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function id(value: unknown): value is string {
  return typeof value === "string" && ID_PATTERN.test(value);
}

function positivePaise(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) &&
    value > 0 && value <= MAX_CAPTURE_PAISE;
}

function validIdentity(candidate: Record<string, unknown>): boolean {
  return PROVIDERS.has(String(candidate.provider)) &&
    ENVIRONMENTS.has(String(candidate.environment)) &&
    id(candidate.merchantAccountId) &&
    id(candidate.paymentId);
}

function validReceipt(candidate: Record<string, unknown>): boolean {
  return validIdentity(candidate) &&
    candidate.source === "SERVER_VERIFIED" &&
    id(candidate.orderId) &&
    positivePaise(candidate.amountPaise) &&
    typeof candidate.currency === "string" &&
    /^[A-Z]{3}$/.test(candidate.currency);
}

function validAttempt(candidate: Record<string, unknown>): boolean {
  return PROVIDERS.has(String(candidate.provider)) &&
    ENVIRONMENTS.has(String(candidate.environment)) &&
    id(candidate.merchantAccountId) &&
    id(candidate.orderId) &&
    positivePaise(candidate.expectedAmountPaise) &&
    candidate.currency === "INR";
}

/**
 * Provider event IDs are intentionally excluded: distinct notifications may
 * describe the same captured provider payment. The tuple prevents collisions
 * between merchants, providers and test/live environments.
 */
export function captureBusinessIdentity(receipt: unknown): string | null {
  const candidate = record(receipt);
  if (!candidate || !validIdentity(candidate)) return null;
  return JSON.stringify([
    candidate.provider,
    candidate.merchantAccountId,
    candidate.environment,
    candidate.paymentId,
  ]);
}

/**
 * A classification is a proposed action for a reviewed transactional handler:
 * - REJECT: structurally malformed or untrusted normalized input;
 * - CORRELATION_EXCEPTION: verified capture mismatches its intended attempt;
 * - DUPLICATE_CAPTURE: identical payment business identity already recorded;
 * - EXCESS_CAPTURE_EXCEPTION: distinct real capture after intent fulfilment;
 * - ELIGIBLE_FOR_POSTING: may be considered by a separate atomic posting gate.
 */
export function classifyCaptureDisposition(value: unknown): CaptureDisposition {
  const input = record(value);
  const attempt = record(input?.attempt);
  const receipt = record(input?.receipt);
  const history = input?.priorCapturedReceipts;
  if (!input || !attempt || !receipt || !validAttempt(attempt) ||
      !validReceipt(receipt) ||
      typeof input.intendedUnitFulfilled !== "boolean" ||
      !Array.isArray(history) || history.length > 5000) {
    return "REJECT";
  }

  const recorded = new Map<string, Record<string, unknown>>();
  for (const previousValue of history as unknown[]) {
    const previous = record(previousValue);
    if (!previous || !validReceipt(previous)) return "REJECT";
    const identity = captureBusinessIdentity(previous);
    if (!identity) return "REJECT";
    const earlier = recorded.get(identity);
    // Contradictory records for the same captured provider payment require
    // reconciliation; an event-ID retry must never erase the discrepancy.
    if (earlier && (earlier.orderId !== previous.orderId ||
        earlier.amountPaise !== previous.amountPaise ||
        earlier.currency !== previous.currency)) {
      return "CORRELATION_EXCEPTION";
    }
    recorded.set(identity, previous);
  }

  if (receipt.provider !== attempt.provider ||
      receipt.merchantAccountId !== attempt.merchantAccountId ||
      receipt.environment !== attempt.environment ||
      receipt.orderId !== attempt.orderId ||
      receipt.amountPaise !== attempt.expectedAmountPaise ||
      receipt.currency !== attempt.currency) {
    return "CORRELATION_EXCEPTION";
  }

  const identity = captureBusinessIdentity(receipt);
  if (!identity) return "REJECT";
  const earlier = recorded.get(identity);
  if (earlier) {
    if (earlier.orderId !== receipt.orderId ||
        earlier.amountPaise !== receipt.amountPaise ||
        earlier.currency !== receipt.currency) {
      return "CORRELATION_EXCEPTION";
    }
    return "DUPLICATE_CAPTURE";
  }
  if (input.intendedUnitFulfilled) return "EXCESS_CAPTURE_EXCEPTION";
  return "ELIGIBLE_FOR_POSTING";
}
