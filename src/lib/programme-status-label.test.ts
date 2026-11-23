import { describe, expect, it } from "vitest";
import { programmeStatusLabel } from "./programme-status-label";

describe("medical and financial assistance status labels", () => {
  it("does not represent an ongoing accident recovery case as a completed fundraiser", () => {
    expect(programmeStatusLabel("medical-financial-relief", "accident-recovery-support-2026", "ONGOING"))
      .toBe("Ongoing assistance");
  });

  it("identifies the closed collection separately from the beneficiary's medical recovery", () => {
    expect(programmeStatusLabel("medical-financial-relief", "medical-recovery-relief-2026", "COMPLETED"))
      .toBe("Collection closed · assistance delivered");
  });

  it("preserves existing financial and medical case labels", () => {
    expect(programmeStatusLabel("medical-financial-relief", "jewellery-loan-intervention", "COMPLETED"))
      .toBe("Assistance completed");
    expect(programmeStatusLabel("medical-financial-relief", "aliza-critical-care-support", "COMPLETED"))
      .toBe("Fundraising completed");
  });

  it("preserves status labels for unrelated programmes", () => {
    expect(programmeStatusLabel("amaana-taleem", "taleem-nazira-sponsorship", "ONGOING"))
      .toBe("Ongoing sponsorship");
    expect(programmeStatusLabel("ramadan-eid", "eid-gift-kits", "RECURRING"))
      .toBe("Recurring programme");
  });
});
