import { describe, expect, it } from "vitest";
import { spendingPublicationReview } from "./spending-publication-review";

type Entry = Parameters<typeof spendingPublicationReview>[0];
const draft: Entry = { status: "DRAFT", publicSummary: "Distributed essential food supplies.", createdById: "maker", pool: "NON_ZAKAT", zakatEligibilityConfirmedAt: null };
const review = (over: Partial<Entry> = {}, actor = "checker", sole = false) => spendingPublicationReview({ ...draft, ...over }, actor, sole);

describe("private draft publication guidance", () => {
  it("returns the proposed summary and second-person review evidence", () => {
    expect(review()).toEqual({ summary: draft.publicSummary, summaryReady: true, reviewer: "second-person", eligibility: "not-applicable" });
  });
  it("distinguishes maker, configured exception and missing recorder", () => {
    expect(review({}, "maker")?.reviewer).toBe("same-person");
    expect(review({}, "maker", true)?.reviewer).toBe("sole-operator");
    expect(review({ createdById: null })?.reviewer).toBe("unrecorded");
  });
  it("withholds incomplete or suspect public text using the existing service validator", () => {
    for (const publicSummary of [null, "short", "Email private@example.invalid", "Call 1234567890", "x".repeat(401)]) {
      expect(review({ publicSummary })).toMatchObject({ summary: null, summaryReady: false });
    }
  });
  it("distinguishes stored Zakat confirmation from missing evidence", () => {
    expect(review({ pool: "ZAKAT" })?.eligibility).toBe("not-recorded");
    expect(review({ pool: "ZAKAT", zakatEligibilityConfirmedAt: new Date("2026-11-01") })?.eligibility).toBe("recorded");
    expect(review({ pool: "ZAKAT", zakatEligibilityConfirmedAt: new Date(NaN) })?.eligibility).toBe("not-recorded");
  });
  it("does not offer a draft preview for non-draft entries", () => {
    for (const status of ["PUBLISHED", "VOID", "unknown"]) expect(review({ status })).toBeNull();
  });
});
