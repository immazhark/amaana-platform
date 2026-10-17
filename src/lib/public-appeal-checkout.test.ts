import { describe, expect, it } from "vitest";
import { getPublicAppealCheckoutEligibility } from "./public-appeal-checkout";

const now = new Date("2026-10-17T08:00:00Z");
const appeal = (raised: number, goal: number, overrides: Record<string, unknown> = {}) => ({
  status: "PUBLISHED", amountRaised: raised, goalAmount: goal,
  closesAt: "2026-11-30T00:00:00Z", ...overrides,
});

describe("public appeal and whole-rupee checkout consistency", () => {
  it("preserves paise-accurate remainder while offering payable rupee choices", () => {
    expect(getPublicAppealCheckoutEligibility(appeal(100.3, 500.01), now))
      .toMatchObject({ progress: { remainingLabel: "₹399.71" }, range: { minimum: 10, maximum: 399 } });
  });
  it("retains the approved exact whole-rupee payment for a final balance below ₹10", () => {
    expect(getPublicAppealCheckoutEligibility(appeal(991, 1000), now)?.range)
      .toEqual({ minimum: 9, maximum: 9 });
  });
  it.each([[999.5,1000],[990.5,1000],[999.99,1000],[1000,1000],[1001,1000]])(
    "does not advertise an unpayable or funded appeal balance: %s / %s", (raised, goal) => {
      expect(getPublicAppealCheckoutEligibility(appeal(raised, goal), now)).toBeNull();
    },
  );
  it("rejects malformed, closed or past-due campaigns despite PUBLISHED index data", () => {
    expect(getPublicAppealCheckoutEligibility(appeal(1.001, 100), now)).toBeNull();
    expect(getPublicAppealCheckoutEligibility(appeal(0, 100, {status:"CLOSED"}), now)).toBeNull();
    expect(getPublicAppealCheckoutEligibility(appeal(0, 100, {closesAt:"2026-10-16"}), now)).toBeNull();
    expect(getPublicAppealCheckoutEligibility(appeal(0, 100, {goalAmount:0}), now)).toBeNull();
  });
  it("bounds large appeals to the server's supported one-million-rupee maximum", () => {
    expect(getPublicAppealCheckoutEligibility(appeal(0, 2_000_000), now)?.range)
      .toEqual({ minimum: 10, maximum: 1_000_000 });
  });
});
