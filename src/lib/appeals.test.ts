import { describe, expect, it } from "vitest";
import { appealStatusAfterRefund, getAppealProgressPercent, getRemainingAppealAmount, isAppealOpenForDonations, shouldMarkAppealFunded } from "./appeals";

const decimalLike = (value: number) => ({ toNumber: () => value });
const now = new Date("2026-09-15T12:00:00.000Z");

describe("getAppealProgressPercent", () => {
  it.each([
    { raised: decimalLike(0), goal: 75_000, expected: 0 },
    { raised: 10_000, goal: "75000", expected: 13 },
    { raised: 75_000, goal: decimalLike(75_000), expected: 100 },
    { raised: 90_000, goal: 75_000, expected: 100 },
    { raised: -500, goal: 75_000, expected: 0 },
    { raised: "invalid", goal: 75_000, expected: 0 },
    { raised: Number.POSITIVE_INFINITY, goal: 75_000, expected: 0 },
    { raised: 100, goal: 0, expected: 0 },
    { raised: 100, goal: -1, expected: 0 },
    { raised: 100, goal: Number.NaN, expected: 0 },
    { raised: 1e308, goal: 1e-308, expected: 100 },
  ])("renders a finite 0-100 funding meter for raised=$raised goal=$goal", ({ raised, goal, expected }) => {
    expect(getAppealProgressPercent(raised, goal)).toBe(expected);
  });
});

describe("getRemainingAppealAmount", () => {
  it("returns the exact remaining need across decimal-like and string values", () => {
    expect(getRemainingAppealAmount(decimalLike(74_900), "75000")).toBe(100);
  });

  it("never returns a negative remaining amount", () => {
    expect(getRemainingAppealAmount(80_000, 75_000)).toBe(0);
  });
});

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

  it.each([
    { raised: 0, goal: 0, closesAt: null },
    { raised: 0, goal: -10, closesAt: null },
    { raised: -1, goal: 75_000, closesAt: null },
    { raised: "invalid", goal: 75_000, closesAt: null },
    { raised: 0, goal: "invalid", closesAt: null },
    { raised: Number.NaN, goal: 75_000, closesAt: null },
    { raised: 0, goal: Number.POSITIVE_INFINITY, closesAt: null },
    { raised: Number.POSITIVE_INFINITY, goal: 75_000, closesAt: null },
    { raised: 1, goal: 75_000, closesAt: "not-a-date" },
    { raised: 1, goal: 75_000, closesAt: "" },
    { raised: 1, goal: 75_000, closesAt: new Date(Number.NaN) },
  ])("does not expose donation links for malformed fundraising inputs: %#", ({ raised, goal, closesAt }) => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: raised,
      goalAmount: goal,
      closesAt,
    }, now)).toBe(false);
  });

  it("rejects an invalid reference clock instead of leaving an appeal open", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: 10_000,
      goalAmount: 75_000,
    }, new Date(Number.NaN))).toBe(false);
  });

  it("accepts a valid amount encoded as a numeric string and a future Date deadline", () => {
    expect(isAppealOpenForDonations({
      status: "PUBLISHED",
      amountRaised: "10000",
      goalAmount: decimalLike(75_000),
      closesAt: new Date("2026-09-16T12:00:00.000Z"),
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


describe("appealStatusAfterRefund", () => {
  it("reopens a funded appeal when a refund drops retained funds below target during an open fundraising window", () => {
    expect(appealStatusAfterRefund(
      "FUNDED",
      70_000,
      75_000,
      "2026-09-20T12:00:00.000Z",
      now,
    )).toBe("PUBLISHED");
  });

  it("closes rather than reopens a funded appeal when its fundraising window has expired", () => {
    expect(appealStatusAfterRefund(
      "FUNDED",
      70_000,
      75_000,
      "2026-09-14T12:00:00.000Z",
      now,
    )).toBe("CLOSED");
  });

  it("keeps a funded appeal funded when retained funds still meet the goal", () => {
    expect(appealStatusAfterRefund("FUNDED", 75_000, 75_000, null, now)).toBe("FUNDED");
  });

  it.each(["PAUSED", "CLOSED", "REJECTED", "DRAFT", "PUBLISHED"])("never overrides manually controlled %s state", status => {
    expect(appealStatusAfterRefund(status, 1, 75_000, null, now)).toBe(status);
  });
});
