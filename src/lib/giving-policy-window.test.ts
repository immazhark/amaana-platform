import { describe, expect, it } from "vitest";
import { canReviewGeneralFundAtDate } from "./giving-policy-window";

const reviewed = {
  fund: {
    id: "fund-general",
    status: "ACTIVE",
    currentPolicyVersionId: "policy-v2026",
    eligibleIntents: ["GENERAL"],
  },
  policy: {
    id: "policy-v2026",
    fundId: "fund-general",
    status: "ACTIVE",
    evidenceRef: "approved-charter-ref",
    effectiveFromDate: "2026-11-01",
    validThroughDate: "2026-11-30",
    eligibleIntents: ["GENERAL"],
  },
  intent: "GENERAL",
};
const at = "2026-11-09";

describe("offline General fund policy effective-window review", () => {
  it("accepts a reviewed matching active General policy on its inclusive start/end dates", () => {
    expect(canReviewGeneralFundAtDate(reviewed, "2026-11-01")).toBe(true);
    expect(canReviewGeneralFundAtDate(reviewed, at)).toBe(true);
    expect(canReviewGeneralFundAtDate(reviewed, "2026-11-30")).toBe(true);
  });

  it("does not approve not-yet-effective or expired policies", () => {
    expect(canReviewGeneralFundAtDate(reviewed, "2026-10-31")).toBe(false);
    expect(canReviewGeneralFundAtDate(reviewed, "2026-12-01")).toBe(false);
  });

  it("requires explicit, valid Asia/Kolkata calendar dates rather than browser clock defaults", () => {
    for (const invalidDate of ["", "2026-11-9", "2026-02-30", "2026-13-01", "2026-11-09T00:00:00Z", "today", null, undefined]) {
      expect(canReviewGeneralFundAtDate(reviewed, invalidDate)).toBe(false);
    }
  });

  it("does not silently revive a paused, closed, superseded or unapproved policy", () => {
    expect(canReviewGeneralFundAtDate({ ...reviewed, fund: { ...reviewed.fund, status: "PAUSED" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, status: "CLOSED" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, status: "APPROVED" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, fund: { ...reviewed.fund, currentPolicyVersionId: "superseding-version" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, fundId: "different-fund" } }, at)).toBe(false);
  });

  it("rejects missing approval evidence, an invalid range, or malformed policy dates", () => {
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, evidenceRef: "" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, evidenceRef: "  " } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, effectiveFromDate: "2026-12-01" } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, validThroughDate: "2026-02-30" } }, at)).toBe(false);
  });

  it("never infers Zakat, Sadaqah, endowment or other restricted eligibility", () => {
    for (const intent of ["ZAKAT", "SADAQAH", "ENDOWMENT", null]) {
      expect(canReviewGeneralFundAtDate({ ...reviewed, intent }, at)).toBe(false);
    }
    expect(canReviewGeneralFundAtDate({ ...reviewed, policy: { ...reviewed.policy, eligibleIntents: ["ZAKAT"] } }, at)).toBe(false);
    expect(canReviewGeneralFundAtDate({ ...reviewed, fund: { ...reviewed.fund, eligibleIntents: [] } }, at)).toBe(false);
  });

  it("rejects missing, malformed or non-object sources without a published policy", () => {
    for (const candidate of [null, undefined, [], {}, "General", { ...reviewed, policy: null }, { ...reviewed, fund: null }]) {
      expect(canReviewGeneralFundAtDate(candidate, at)).toBe(false);
    }
  });
});
