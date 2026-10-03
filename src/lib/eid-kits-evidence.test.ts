import { describe, expect, it } from "vitest";
import { parseEidKitsEvidence } from "./eid-kits-evidence";

const validEvidence = {
  history: [
    { year: 2020, families: 85, donations: "₹68,000.00", kitCost: "₹797" },
    { year: 2021, families: 171, donations: "₹226,008.74", kitCost: "₹1,327" },
    { year: 2022, families: 339, donations: "₹484,770.00", kitCost: "₹1,430" },
    { year: 2023, families: 408, donations: "₹610,153.28", kitCost: "₹1,500" },
    { year: 2024, families: 467, donations: "₹700,500.00", kitCost: "₹1,500" },
    { year: 2025, families: 650, donations: "₹1,110,742.53", kitCost: "₹1,709" },
    { year: 2026, families: 710 },
  ],
  breakdown2026: [
    { label: "Women-led households of hardship", count: 201, share: "28.3%" },
    { label: "Children & vulnerable students", count: 134, share: "18.9%" },
    { label: "Masjid-linked", count: 86, share: "12.1%" },
    { label: "Other financially vulnerable", count: 118, share: "16.6%" },
    { label: "Daily wage labour & skilled", count: 65, share: "9.2%" },
    { label: "Widows (primary need)", count: 55, share: "7.7%" },
    { label: "Drivers & transport", count: 33, share: "4.6%" },
    { label: "Medical hardship & disability", count: 18, share: "2.5%" },
  ],
  sourceStatus: "Approved website figures; archive reconciliation continues.",
};

describe("parseEidKitsEvidence", () => {
  it("accepts the approved 2026 total of 710", () => {
    expect(parseEidKitsEvidence(validEvidence)?.breakdown2026.reduce((sum, item) => sum + item.count, 0)).toBe(710);
  });

  it("fails closed when category totals do not equal 710", () => {
    const invalid = structuredClone(validEvidence);
    invalid.breakdown2026[7].count = 17;
    expect(parseEidKitsEvidence(invalid)).toBeNull();
  });

  it("fails closed when the 2026 historical record is not exactly 710", () => {
    const invalid = structuredClone(validEvidence);
    invalid.history[6].families = 709;
    expect(parseEidKitsEvidence(invalid)).toBeNull();
  });
});
