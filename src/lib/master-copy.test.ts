import { describe, expect, it } from "vitest";
import { programmeBySlug } from "./master-copy";

describe("runtime canonical factual locks", () => {
  it("uses the corrected newborn amount in rendered programme copy", () => {
    const newborn = programmeBySlug("emergency-neonatal-medical-aid");
    expect(newborn).toBeTruthy();
    expect(newborn?.primaryMetric).toBe("₹107,520");
    expect(newborn?.summary).toContain("₹107,520");
    expect(newborn?.story).toContain("₹107,520");
    expect(newborn?.summary).not.toContain("₹107,200");
  });

  it("uses the resolved Winter 234 kits to 234 beneficiaries wording at runtime", () => {
    const winter = programmeBySlug("winter-relief");
    expect(winter).toBeTruthy();
    expect(winter?.primaryMetric).toBe("234 Winter Kits");
    expect(winter?.primaryMetricLabel).toBe("distributed to 234 beneficiaries");
    expect(winter?.summary).toContain("234 Winter Kits to 234 beneficiaries");
  });
});
