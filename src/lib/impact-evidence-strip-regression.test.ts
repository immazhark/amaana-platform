import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("published-metrics evidence strip on impact", () => {
  const source = readFileSync(new URL("../app/impact/page.tsx", import.meta.url), "utf8");
  it("reuses already fetched, reviewed initiative facts, never a pooled fundraising total", () => {
    expect(source).toContain("const [rawInitiatives, anonymousNotes] = await Promise.all([");
    expect(source).toContain("getImpactPageData(), getPublishedAnonymousOutcomeNotes(),");
    expect(source).toContain("const publishedImpact = initiatives");
    expect(source).toContain("item.primaryMetric?.trim() && item.primaryMetricLabel?.trim()");
    expect(source).toContain("value: item.primaryMetric!, label: item.primaryMetricLabel!");
    expect(source).not.toContain("getDonationImpactHighlights()");
  });
  it("only mounts the evidence strip when approved impact figures exist", () => {
    expect(source).toContain("publishedImpact.length > 0");
    expect(source).toContain('headingId="impact-published-outcomes"');
    expect(source).toContain("VerifiedImpactStrip");
  });
});
