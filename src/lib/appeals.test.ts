import { describe, expect, it } from "vitest";
import { isAppealOpenForDonations, shouldMarkAppealFunded } from "./appeals";

const decimalLike = (value: number) => ({ toNumber: () => value });
const now = new Date("2026-09-15T12:00:00.000Z");

describe("isAppealOpenForDonations", () => {
  it("accepts a published appeal below target with no close date", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: decimalLike(50_000),
      goalAmount: decimalLike(75_000),
      closesAt: null,
    }, now)).toBe(true);
  });

  it("accepts a published appeal below target before a future close time", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: 50_000,
      goalAmount: 75_000,
      closesAt: "2026-09-16T12:00:00.000Z",
    }, now)).toBe(true);
  });

  it("rejects an appeal exactly at target", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: "75000",
      goalAmount: "75000",
    }, now)).toBe(false);
  });

  it("rejects an appeal above target", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: decimalLike(75_001),
      goalAmount: decimalLike(75_000),
    }, now)).toBe(false);
  });

  it.each(["FUNDED", "PAUSED", "CLOSED", "DRAFT"])("rejects %s appeal status", status => {
    expect(isAppealOpenForDonations({
      status,
      amountRaised: 10_000,
      goalAmount: 75_000,
    }, now)).toBe(false);
  });

  it("rejects an appeal whose close time is exactly now", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: 10_000,
      goalAmount: 75_000,
      closesAt: now,
    }, now)).toBe(false);
  });

  it("rejects an appeal whose close time has passed", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: 10_000,
      goalAmount: 75_000,
      closesAt: "2026-09-14T12:00:00.000Z",
    }, now)).toBe(false);
  });
});

describe("shouldMarkAppealFunded", () => {
  it("marks a published appeal funded at the exact target", () => {
    expect(shouldMarkAppealFunded("PUBLISHED", decimalLike(75_000), decimalLike(75_000))).toBe(true);
  });

  it("marks a published appeal funded when an in-flight payment takes it above target", () => {
    expect(shouldMarkAppealFunded("PUBLISHED", 80_000, 75_000)).toBe(true);
  });

  it("does not rewrite an already non-published state", () => {
    expect(shouldMarkAppealFunded("CLOSED", 80_000, 75_000)).toBe(false);
  });
});
