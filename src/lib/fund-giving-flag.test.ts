import { describe, expect, it } from "vitest";
import { isFundGivingEnabled } from "./fund-giving-flag";

describe("fund giving activation switch", () => {
  it("is on only for the exact string true", () => {
    expect(isFundGivingEnabled({ FUND_GIVING_ENABLED: "true" })).toBe(true);
    for (const value of [undefined, "", "TRUE", "True", "1", "yes", "false", " true", "true "]) expect(isFundGivingEnabled({ FUND_GIVING_ENABLED: value })).toBe(false);
    expect(isFundGivingEnabled({})).toBe(false);
  });
});
