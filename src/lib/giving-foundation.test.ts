import { describe, expect, it } from "vitest";
import {
  parseExactPaise,
  validateAllocation,
  validateBalancedJournal,
  validateGivingProposal,
  validateProviderCapability,
} from "./giving-foundation";

describe("giving foundation: safe exact arithmetic", () => {
  it("converts decimal strings to exact paise without floating-point rounding", () => {
    expect(parseExactPaise("0.01")).toBe(1);
    expect(parseExactPaise("100.20")).toBe(10020);
    expect(parseExactPaise("1000000.00")).toBe(100000000);
  });

  it.each(["", " 10", "10 ", "1e3", "1.234", "-1", "1,000", "NaN", "1000000.01"])(
    "rejects malformed or out-of-bound amount %s",
    input => {
      expect(() => parseExactPaise(input)).toThrow();
    },
  );

  it("conserves gross amounts and refuses duplicate allocations or underallocation", () => {
    expect(
      validateAllocation(10001, [
        { fundId: "education", amountPaise: 10000 },
        { fundId: "general", amountPaise: 1 },
      ]),
    ).toBe(true);
    expect(validateAllocation(100, [{ fundId: "general", amountPaise: 99 }])).toBe(false);
    expect(
      validateAllocation(100, [
        { fundId: "general", amountPaise: 60 },
        { fundId: "general", amountPaise: 40 },
      ]),
    ).toBe(false);
    expect(validateAllocation(100, [{ fundId: "general", amountPaise: 101 }])).toBe(false);
    expect(validateAllocation(0, [{ fundId: "general", amountPaise: 0 }])).toBe(false);
  });

  it("requires journal debits and credits to match and all entries to be positive", () => {
    expect(
      validateBalancedJournal([
        { account: "clearing", side: "DEBIT", amountPaise: 105 },
        { account: "restricted", side: "CREDIT", amountPaise: 100 },
        { account: "general", side: "CREDIT", amountPaise: 5 },
      ]),
    ).toBe(true);
    expect(
      validateBalancedJournal([
        { account: "clearing", side: "DEBIT", amountPaise: 100 },
        { account: "general", side: "CREDIT", amountPaise: 99 },
      ]),
    ).toBe(false);
    expect(validateBalancedJournal([{ account: "clearing", side: "DEBIT", amountPaise: 0 }])).toBe(false);
  });
});

describe("giving foundation: proposals and capabilities fail closed", () => {
  const fund = { id: "general", status: "ACTIVE" as const, eligibleIntents: ["GENERAL"] as const };
  const policy = { id: "general-policy-v1", fundId: "general", status: "ACTIVE" as const, evidenceRef: "review-001" };
  const price = { id: "general-price", policyId: "general-policy-v1", amountPaise: 10000, status: "ACTIVE" as const };
  const proposal = { fund, policy, price, intent: "GENERAL", amountPaise: 10000 };

  it("accepts a matching active, evidence-backed general giving proposal", () => {
    expect(validateGivingProposal(proposal)).toBe(true);
  });

  it("rejects inactive, mismatched, unsupported or unevidenced fund/policy/price claims", () => {
    expect(validateGivingProposal({ ...proposal, fund: { ...fund, status: "DRAFT" } })).toBe(false);
    expect(validateGivingProposal({ ...proposal, policy: { ...policy, fundId: "another" } })).toBe(false);
    expect(validateGivingProposal({ ...proposal, price: { ...price, policyId: "other" } })).toBe(false);
    expect(validateGivingProposal({ ...proposal, policy: { ...policy, evidenceRef: "" } })).toBe(false);
    expect(validateGivingProposal({ ...proposal, intent: "ENDOWMENT" })).toBe(false);
    expect(validateGivingProposal({ ...proposal, amountPaise: -1 })).toBe(false);
  });

  const capability = {
    accountId: "domestic-inr",
    environment: "LIVE" as const,
    method: "RAZORPAY" as const,
    frequency: "ONE_TIME" as const,
    currency: "INR" as const,
    enabled: true,
  };

  it("permits only an exact active account/environment/method/frequency/currency match", () => {
    expect(validateProviderCapability(capability, { accountId: "domestic-inr", environment: "LIVE", method: "RAZORPAY", frequency: "ONE_TIME", currency: "INR" })).toBe(true);
    expect(validateProviderCapability(capability, { accountId: "foreign", environment: "LIVE", method: "RAZORPAY", frequency: "ONE_TIME", currency: "INR" })).toBe(false);
    expect(validateProviderCapability(capability, { accountId: "domestic-inr", environment: "TEST", method: "RAZORPAY", frequency: "ONE_TIME", currency: "INR" })).toBe(false);
    expect(validateProviderCapability(capability, { accountId: "domestic-inr", environment: "LIVE", method: "BANK_TRANSFER", frequency: "ONE_TIME", currency: "INR" })).toBe(false);
    expect(validateProviderCapability(capability, { accountId: "domestic-inr", environment: "LIVE", method: "RAZORPAY", frequency: "RECURRING", currency: "INR" })).toBe(false);
    expect(validateProviderCapability({ ...capability, enabled: false }, { accountId: "domestic-inr", environment: "LIVE", method: "RAZORPAY", frequency: "ONE_TIME", currency: "INR" })).toBe(false);
    expect(validateProviderCapability(capability, { accountId: "domestic-inr", environment: "LIVE", method: "RAZORPAY", frequency: "ONE_TIME", currency: "USD" })).toBe(false);
  });
});


describe("capability enum primitive boundaries", () => {
  it.each([
    ["environment", "LIVE"], ["method", "RAZORPAY"], ["frequency", "ONE_TIME"],
  ])("rejects shared non-string %s values", (field, label) => {
    const valid = { accountId: "domestic-inr", environment: "LIVE", method: "RAZORPAY", frequency: "ONE_TIME", currency: "INR", enabled: true };
    for (const value of [[label], { toString: () => label }]) {
      expect(validateProviderCapability({ ...valid, [field]: value }, { ...valid, [field]: value })).toBe(false);
      expect(validateProviderCapability({ ...valid, [field]: value }, valid)).toBe(false);
      expect(validateProviderCapability(valid, { ...valid, [field]: value })).toBe(false);
    }
  });
});
