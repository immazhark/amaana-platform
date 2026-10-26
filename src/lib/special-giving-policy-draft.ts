/**
 * AF-FIDYA: offline policy inventory only. This is not a checkout, ruling,
 * price schedule, allocation approval or religious/finance attestation.
 */
export const SPECIAL_GIVING_CATEGORIES = Object.freeze([
  "FIDYA", "KAFFARAH", "AQIQAH", "WAQF",
] as const);

export type SpecialGivingCategory = typeof SPECIAL_GIVING_CATEGORIES[number];

const REQUIREMENTS = Object.freeze([
  "QUALIFIED_RELIGIOUS_REVIEW",
  "UNIT_COST_REVIEW",
  "DESTINATION_REVIEW",
  "FUND_ALLOCATION_REVIEW",
  "LEGAL_FINANCE_REVIEW",
] as const);

export type SpecialGivingPolicyDraft = Readonly<{
  category: SpecialGivingCategory;
  state: "UNREVIEWED_NOT_AVAILABLE";
  currency: "INR";
  requires: typeof REQUIREMENTS;
  checkoutAllowed: false;
}>;

/**
 * Accepts one exact category key from an ordinary object. Refuses price,
 * personal data and apparent approval fields, which cannot establish authority.
 */
export function prepareSpecialGivingPolicyDraft(input: unknown): SpecialGivingPolicyDraft {
  if (input === null || typeof input !== "object" || Array.isArray(input) ||
      Object.getPrototypeOf(input) !== Object.prototype) {
    throw new Error("Invalid special giving draft request");
  }
  const keys = Reflect.ownKeys(input);
  const categoryProperty = Object.getOwnPropertyDescriptor(input, "category");
  if (keys.length !== 1 || keys[0] !== "category" || !categoryProperty ||
      !("value" in categoryProperty) || !categoryProperty.enumerable) {
    throw new Error("Special giving draft accepts only an exact category");
  }
  const category = categoryProperty.value;
  if (typeof category !== "string" || !SPECIAL_GIVING_CATEGORIES.some(value => value === category)) {
    throw new Error("Unrecognized or unreviewed special giving category");
  }
  return Object.freeze({
    category: category as SpecialGivingCategory,
    state: "UNREVIEWED_NOT_AVAILABLE" as const,
    currency: "INR" as const,
    requires: REQUIREMENTS,
    checkoutAllowed: false as const,
  });
}
