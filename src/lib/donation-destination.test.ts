import { describe, expect, it } from "vitest";
import { requireDonationDestination } from "./donation-destination";

describe("persisted donation financial destination", () => {
  it("preserves a historical appeal-only record", () => {
    expect(requireDonationDestination({ appealId: "legacy-appeal" })).toEqual({ kind: "APPEAL", id: "legacy-appeal" });
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
