import { describe, expect, it } from "vitest";
import { requireDonationDestination, resolvePrivateDonationPurpose } from "./donation-destination";

describe("persisted donation financial destination", () => {
  it("preserves a historical appeal-only record", () => {
    expect(requireDonationDestination({ appealId: "legacy-appeal" })).toEqual({ kind: "APPEAL", id: "legacy-appeal" });
  });
  it("uses original reviewed fund purpose rather than later renamed fund title", () => {
    expect(resolvePrivateDonationPurpose({
      appealId: null, fundId: "approved-fund", givingIntent: "GENERAL",
      fund: { name: "Renamed fund" },
      designationSnapshot: {
        version: 1, kind: "FUND", fundId: "approved-fund", fundRevision: 5,
        label: "Original approved name",
        purpose: "A full separately approved purpose for the programme.",
        disclosure: "A full approved disclosure describing restricted donations.",
        accountCode: "TEST-FUND", givingIntent: "GENERAL",
      },
    })).toEqual({ label: "Original approved name", provenance: "original" });
  });
  it("fails closed on malformed fund designation without accepting today's purpose", () => {
    expect(resolvePrivateDonationPurpose({
      appealId: null, fundId: "approved-fund", givingIntent: "GENERAL",
      fund: { name: "Renamed fund" }, designationSnapshot: null,
    })).toEqual({ label: "Fund designation requires review", provenance: "review" });
  });
  it("identifies a fund-only designation", () => {
    expect(requireDonationDestination({ appealId: null, fundId: "approved-fund" }))
      .toEqual({ kind: "FUND", id: "approved-fund" });
  });
  it.each([{}, { appealId: null, fundId: null }, { appealId: "a", fundId: "f" },
    { appealId: "", fundId: null }, { appealId: null, fundId: "" }])(
    "fails closed on missing or mixed financial destinations: %#", value => {
      expect(() => requireDonationDestination(value)).toThrow(/exactly one/);
    },
  );
});
