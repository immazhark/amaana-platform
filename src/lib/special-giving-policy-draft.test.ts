import { describe, expect, it } from "vitest";
import { DONATION_INTENTS } from "@/lib/donation-intent";
import { donationSchema } from "@/lib/donations";
import { prepareSpecialGivingPolicyDraft, SPECIAL_GIVING_CATEGORIES } from "@/lib/special-giving-policy-draft";

const validCheckout = {
  appealId: "cmf1234567890123456789012",
  donorName: "Synthetic Donor",
  donorEmail: "synthetic@example.test",
  amount: 500,
  domesticConfirmed: true,
};

describe("AF-FIDYA inactive special giving policy contract", () => {
  it("recognizes four distinct policy categories but never enables collection", () => {
    expect(SPECIAL_GIVING_CATEGORIES).toEqual(["FIDYA", "KAFFARAH", "AQIQAH", "WAQF"]);
    for (const category of SPECIAL_GIVING_CATEGORIES) {
      const draft = prepareSpecialGivingPolicyDraft({ category });
      expect(draft).toEqual({
        category,
        state: "UNREVIEWED_NOT_AVAILABLE",
        currency: "INR",
        requires: ["QUALIFIED_RELIGIOUS_REVIEW", "UNIT_COST_REVIEW", "DESTINATION_REVIEW", "FUND_ALLOCATION_REVIEW", "LEGAL_FINANCE_REVIEW"],
        checkoutAllowed: false,
      });
      expect(Object.isFrozen(draft)).toBe(true);
      expect(Object.isFrozen(draft.requires)).toBe(true);
    }
  });

  it("never accepts proposed prices, destinations, approvals or donor identity as activation authority", () => {
    for (const extra of [
      { amount: 500 }, { unitPriceInr: 500 }, { currency: "USD" }, { destination: "synthetic-person" },
      { approved: true }, { reviewed: true }, { religiousRule: "synthetic" },
      { donorEmail: "synthetic@example.test" }, { checkoutAllowed: true },
      { receiptToken: "synthetic-private" }, { paymentLink: "https://example.test/pay" },
    ]) {
      expect(() => prepareSpecialGivingPolicyDraft({ category: "FIDYA", ...extra })).toThrow();
    }
  });

  it("rejects non-exact, ambiguous, unsupported and malformed categories", () => {
    for (const invalid of [
      null, undefined, {}, [], { category: "FIDYA " }, { category: "fidya" },
      { category: "ZAKAT" }, { category: "SADAQAH" }, { category: "GENERAL" },
      { category: "FIDYA/KAFFARAH" }, { category: 1 }, { category: null },
    ]) expect(() => prepareSpecialGivingPolicyDraft(invalid)).toThrow();
  });

  it("keeps all four categories outside existing domestic INR checkout validation", () => {
    expect(DONATION_INTENTS).toEqual(["GENERAL", "SADAQAH", "ZAKAT"]);
    for (const category of SPECIAL_GIVING_CATEGORIES) {
      expect(donationSchema.safeParse({ ...validCheckout, givingIntent: category }).success).toBe(false);
    }
    expect(donationSchema.safeParse({ ...validCheckout, givingIntent: "GENERAL" }).success).toBe(true);
  });

  it("does not convert a draft to checkout through forged primitive flags", () => {
    for (const invalid of [true, "FIDYA", 0, { category: "FIDYA", activation: "approved" },
      { category: "FIDYA", approvals: ["religious", "finance"] }]) {
      expect(() => prepareSpecialGivingPolicyDraft(invalid)).toThrow();
    }
  });

  it("rejects hidden, symbolic, inherited and accessor-based approval payloads without invoking getters", () => {
    const hidden = Object.defineProperty({ category: "FIDYA" }, "approved", { value: true });
    const symbol = { category: "FIDYA", [Symbol("reviewed")]: true };
    const inherited = Object.create({ category: "FIDYA" }) as Record<string, unknown>;
    const nullPrototype = Object.assign(Object.create(null) as object, { category: "FIDYA" });
    let getterCalled = false;
    const accessor = Object.defineProperty({}, "category", {
      enumerable: true,
      get() { getterCalled = true; throw new Error("Untrusted getter must not execute"); },
    });
    for (const value of [hidden, symbol, inherited, nullPrototype, accessor]) {
      expect(() => prepareSpecialGivingPolicyDraft(value)).toThrow();
    }
    expect(getterCalled).toBe(false);
  });
});
