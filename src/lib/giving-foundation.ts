/**
 * Offline-only giving foundation contracts.
 *
 * These functions do not create payment orders, record donations, authorize
 * statutory giving purposes or initiate provider operations.
 */
export const MAX_FOUNDATION_PAISE = 100_000_000;

export type GivingAllocation = Readonly<{
  fundId: string;
  amountPaise: number;
}>;

export type JournalLine = Readonly<{
  account: string;
  side: "DEBIT" | "CREDIT";
  amountPaise: number;
}>;

export type GivingFund = Readonly<{
  id: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  eligibleIntents: readonly string[];
}>;

export type GivingPolicy = Readonly<{
  id: string;
  fundId: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
  evidenceRef: string;
}>;

export type GivingPrice = Readonly<{
  id: string;
  policyId: string;
  amountPaise: number;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "CLOSED";
}>;

export type GivingProposal = Readonly<{
  fund: GivingFund;
  policy: GivingPolicy;
  price: GivingPrice;
  intent: string;
  amountPaise: number;
}>;

export type ProviderCapability = Readonly<{
  accountId: string;
  environment: "TEST" | "LIVE";
  method: "RAZORPAY" | "DIRECT_UPI" | "BANK_TRANSFER";
  frequency: "ONE_TIME" | "RECURRING";
  currency: "INR";
  enabled: boolean;
}>;

export type RequestedCapability = Readonly<{
  accountId: string;
  environment: string;
  method: string;
  frequency: string;
  currency: string;
}>;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function nonblank(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function validPaise(value: unknown): value is number {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value > 0 &&
    value <= MAX_FOUNDATION_PAISE;
}

/**
 * Accept only a canonical positive decimal amount, with at most two fractional
 * digits. Never use floating-point multiplication to derive integer paise.
 */
export function parseExactPaise(input: string): number {
  if (typeof input !== "string" || !/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(input)) {
    throw new RangeError("Amount must be a canonical INR decimal string");
  }

  const [rupees, fraction = ""] = input.split(".");
  const paise = BigInt(rupees) * 100n + BigInt(fraction.padEnd(2, "0") || "0");
  if (paise < 1n || paise > BigInt(MAX_FOUNDATION_PAISE)) {
    throw new RangeError("Amount is outside the foundation's supported range");
  }
  return Number(paise);
}

/** An allocation is valid only when every unique fund is named and gross is conserved. */
export function validateAllocation(grossPaise: number, allocations: unknown): boolean {
  if (!validPaise(grossPaise) || !Array.isArray(allocations) || allocations.length === 0) {
    return false;
  }
  const seen = new Set<string>();
  let allocated = 0;
  for (const candidate of allocations as unknown[]) {
    const line = record(candidate);
    if (!line || !nonblank(line.fundId) || seen.has(line.fundId) || !validPaise(line.amountPaise)) {
      return false;
    }
    seen.add(line.fundId);
    allocated += line.amountPaise;
    if (allocated > grossPaise) return false;
  }
  return allocated === grossPaise;
}

/** Both sides of the proposed journal must exist and balance exactly. */
export function validateBalancedJournal(entries: unknown): boolean {
  if (!Array.isArray(entries) || entries.length < 2) return false;
  let debit = 0;
  let credit = 0;
  for (const candidate of entries as unknown[]) {
    const line = record(candidate);
    if (!line || !nonblank(line.account) || !validPaise(line.amountPaise)) return false;
    if (line.side === "DEBIT") debit += line.amountPaise;
    else if (line.side === "CREDIT") credit += line.amountPaise;
    else return false;
    if (!Number.isSafeInteger(debit) || !Number.isSafeInteger(credit)) return false;
  }
  return debit > 0 && debit === credit;
}

/**
 * Only a general-purpose, evidence-backed, active, identity-matching
 * proposal is representable in this first foundation slice.
 * Religious and restricted-purpose approval is a separate gate.
 */
export function validateGivingProposal(candidate: unknown): boolean {
  const proposal = record(candidate);
  const fund = record(proposal?.fund);
  const policy = record(proposal?.policy);
  const price = record(proposal?.price);
  if (!proposal || !fund || !policy || !price) return false;
  if (proposal.intent !== "GENERAL" || !validPaise(proposal.amountPaise)) return false;
  if (!nonblank(fund.id) || fund.status !== "ACTIVE" ||
      !Array.isArray(fund.eligibleIntents) ||
      !fund.eligibleIntents.includes("GENERAL")) return false;
  if (!nonblank(policy.id) || policy.status !== "ACTIVE" ||
      policy.fundId !== fund.id || !nonblank(policy.evidenceRef)) return false;
  if (!nonblank(price.id) || price.status !== "ACTIVE" ||
      price.policyId !== policy.id || !validPaise(price.amountPaise)) return false;
  return price.amountPaise === proposal.amountPaise;
}

/**
 * Exact capability matching only. This is a policy check, not permission to
 * call any provider or collect money.
 */
export function validateProviderCapability(
  capabilityValue: unknown,
  requestedValue: unknown,
): boolean {
  const capability = record(capabilityValue);
  const requested = record(requestedValue);
  if (!capability || !requested || capability.enabled !== true) return false;
  if (!nonblank(capability.accountId) || capability.accountId !== requested.accountId) return false;
  if (capability.currency !== "INR" || requested.currency !== "INR") return false;
  if (!["LIVE", "TEST"].includes(String(capability.environment)) ||
      capability.environment !== requested.environment) return false;
  if (!["RAZORPAY", "DIRECT_UPI", "BANK_TRANSFER"].includes(String(capability.method)) ||
      capability.method !== requested.method) return false;
  if (!["ONE_TIME", "RECURRING"].includes(String(capability.frequency)) ||
      capability.frequency !== requested.frequency) return false;
  return true;
}
