import { describe, expect, it } from "vitest";
import { capacityRemaining, capacityYearBounds, countedCaseWhere } from "./assistance-capacity";

describe("annual capacity", () => {
  it("uses the India-time calendar year, so a late-evening UTC New Year Eve is already next year", () => {
    expect(capacityYearBounds(new Date("2026-12-31T19:00:00Z")).year).toBe(2027);
    expect(capacityYearBounds(new Date("2026-12-31T17:00:00Z")).year).toBe(2026);
    expect(capacityYearBounds(new Date("2026-06-01T00:00:00Z")).start.toISOString()).toBe("2025-12-31T18:30:00.000Z");
  });

  it("counts only accepted cases, not submitted ones, and never other programmes", () => {
    const where = countedCaseWhere(new Date("2026-06-01T00:00:00Z")) as { acceptedAt: object; status: { in: string[] } };
    expect(where.acceptedAt).toHaveProperty("gte");
    expect(where.status.in).toEqual(["APPROVED", "CONVERTED_TO_APPEAL", "CLOSED"]);
  });

  it("never reports negative places", () => {
    expect(capacityRemaining(5)).toBe(7);
    expect(capacityRemaining(15)).toBe(0);
  });
});
