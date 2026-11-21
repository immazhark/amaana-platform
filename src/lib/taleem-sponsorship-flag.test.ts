import { describe, expect, it } from "vitest";
import { isTaleemSponsorshipEnabled } from "./taleem-sponsorship-flag";

describe("Taleem sponsorship activation switch", () => {
  it("is off by default", () => {
    expect(isTaleemSponsorshipEnabled({})).toBe(false);
  });

  it("is not opened by fund giving alone", () => {
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "true" })).toBe(false);
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "true", TALEEM_SPONSORSHIP_ENABLED: "false" })).toBe(false);
  });

  it("is not opened by its own switch while fund giving is closed", () => {
    expect(isTaleemSponsorshipEnabled({ TALEEM_SPONSORSHIP_ENABLED: "true" })).toBe(false);
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "false", TALEEM_SPONSORSHIP_ENABLED: "true" })).toBe(false);
  });

  it("needs both switches to be exactly true", () => {
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "true", TALEEM_SPONSORSHIP_ENABLED: "true" })).toBe(true);
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "TRUE", TALEEM_SPONSORSHIP_ENABLED: "true" })).toBe(false);
    expect(isTaleemSponsorshipEnabled({ FUND_GIVING_ENABLED: "true", TALEEM_SPONSORSHIP_ENABLED: "1" })).toBe(false);
  });
});
