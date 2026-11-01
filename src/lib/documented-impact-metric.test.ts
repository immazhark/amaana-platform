import { describe, expect, it } from "vitest";
import { documentedImpactMetric } from "./documented-impact-metric";

describe("public documented impact figures", () => {
  it("preserves approved published figure and contextual unit exactly", () => {
    expect(documentedImpactMetric("107,520", "documented medical aid")).toEqual({
      value: "107,520", label: "documented medical aid",
    });
    expect(documentedImpactMetric(" ₹1,001 ", " verified kits ")).toEqual({
      value: " ₹1,001 ", label: " verified kits ",
    });
  });

  it.each([
    ["", "kits"], ["  ", "kits"], ["25", null], ["25", "  "],
    [null, "kits"], [undefined, "kits"], ["25", "\t\n "],
  ])("omits incomplete published evidence quantity=%s label=%s", (value, label) => {
    expect(documentedImpactMetric(value, label)).toBeNull();
  });

  it("does not substitute an inferred label, aggregated amount or zero for absent evidence", () => {
    expect(documentedImpactMetric("25", undefined)).toBeNull();
    expect(documentedImpactMetric(null, "beneficiaries")).toBeNull();
    expect(documentedImpactMetric("0", "documented entries")).toEqual({
      value: "0", label: "documented entries",
    });
  });
});
