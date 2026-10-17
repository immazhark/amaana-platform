import { describe, expect, it } from "vitest";
import { getPublicAppealProgress } from "./public-appeal-progress";

describe("public appeal financial presentation", () => {
  it("preserves exact paise across raised, goal and remaining amounts", () => {
    expect(getPublicAppealProgress(100.30, 500.01)).toMatchObject({
      raised: 100.3, goal: 500.01, remaining: 399.71, percentage: 20,
      raisedLabel: "₹100.30", goalLabel: "₹500.01", remainingLabel: "₹399.71",
    });
  });
  it("does not label an incomplete target as 100 percent due to rounding", () => {
    expect(getPublicAppealProgress(999.99, 1000)?.percentage).toBe(99);
    expect(getPublicAppealProgress(1000, 1000)?.percentage).toBe(100);
    expect(getPublicAppealProgress(1001, 1000)?.remaining).toBe(0);
  });
  it.each([
    [Number.NaN, 500], [Infinity, 500], [-1, 500],
    [1.001, 500], [50, 500.005], [50, 0], [50, -20],
    [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])("never publishes inaccurate or unbounded money: %s of %s", (raised, goal) => {
    expect(getPublicAppealProgress(raised, goal)).toBeNull();
  });
  it("supports decimal-like public records and zero-funded approved goals", () => {
    const goal = { toNumber: () => 345.67 };
    expect(getPublicAppealProgress("0", goal)).toMatchObject({
      percentage: 0, remainingLabel: "₹345.67", raisedLabel: "₹0.00",
    });
  });
});
