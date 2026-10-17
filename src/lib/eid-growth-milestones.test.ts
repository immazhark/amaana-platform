import { describe, expect, it } from "vitest";
import { eidGrowth } from "@/content/amaana";
import { buildEidGrowthMilestones } from "./eid-growth-milestones";

describe("canonical Eid family reach timeline", () => {
  it("keeps all seven locked annual counts and cumulative family-distribution total intact", () => {
    const milestones = buildEidGrowthMilestones(eidGrowth);
    expect(milestones.map(item => [item.year, item.familiesReached])).toEqual([
      ["2020", 85], ["2021", 171], ["2022", 339], ["2023", 408],
      ["2024", 467], ["2025", 650], ["2026", 710],
    ]);
    expect(milestones.at(-1)?.cumulativeFamilyDistributions).toBe(2830);
    expect(milestones.at(-1)?.growthFromPrevious).toBe(60);
    expect(milestones[0]?.growthFromPrevious).toBeNull();
  });

  it("derives proportional chart bars from the largest yearly distribution", () => {
    const milestones = buildEidGrowthMilestones(eidGrowth);
    expect(milestones.at(-1)?.barPercent).toBe(100);
    expect(milestones[0]?.barPercent).toBeCloseTo(85 / 710 * 100, 5);
    expect(milestones.every(item => item.barPercent > 0 && item.barPercent <= 100)).toBe(true);
    expect(milestones[2]?.growthFromPrevious).toBe(168);
  });

  it("rejects contradictory data rather than misrepresenting beneficiary support", () => {
    expect(() => buildEidGrowthMilestones([{ year: "2025", families: 12 }, { year: "2025", families: 20 }])).toThrow(/chronological/i);
    expect(() => buildEidGrowthMilestones([{ year: "2024", families: -1 }])).toThrow(/non-negative/i);
    expect(() => buildEidGrowthMilestones([])).toThrow(/at least one/i);
  });
});
