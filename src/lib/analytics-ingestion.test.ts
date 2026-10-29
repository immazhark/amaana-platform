import { describe, expect, it } from "vitest";
import { RequestBodyTooLargeError } from "./bounded-request-body";
import { MAX_ANALYTICS_JSON_BYTES, parseAnalyticsPayload } from "./analytics-ingestion";

function analyticsRequest(body: string) {
  return new Request("https://amaanafoundation.org/api/analytics/page-view", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
  });
}

describe("parseAnalyticsPayload", () => {
  it("accepts a small allowlisted public path", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/about" })))).resolves.toEqual({ path: "/about" });
  });

  it.each([
    "/team", "/recognition", "/partner", "/impact/compare",
    "/get-involved/volunteer", "/get-involved/monthly-giving", "/get-involved/sponsor-education",
  ])("accepts the exact published public route %s without retaining query data", async path => {
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path })))).resolves.toEqual({ path });
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: `${path}?token=private` })))).resolves.toBeNull();
  });

  it("removes beneficiary and story identifiers from ingested daily counters", async () => {
    for (const [raw, normalized] of [
      ["/appeals/person-name-medical-case", "/appeals/:slug"],
      ["/stories/someone-recovery", "/stories/:slug"],
      ["/our-work/eid-gift-kits-2026", "/our-work/:slug"],
      ["/appeals/:slug", "/appeals/:slug"],
    ]) {
      const result = await parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: raw })));
      expect(result).toEqual({ path: normalized });
      expect(JSON.stringify(result)).not.toContain("person-name");
    }
  });

  it("rejects additional submitted identifiers instead of silently stripping them", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({
      path: "/about", beneficiaryName: "PRIVATE",
    })))).resolves.toBeNull();
  });

  it("rejects sensitive and malformed public paths", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/request-assistance" })))).resolves.toBeNull();
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/our-work/not valid" })))).resolves.toBeNull();
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/contact/feedback" })))).resolves.toBeNull();
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/get-involved/volunteer/applicant" })))).resolves.toBeNull();
  });

  it("rejects malformed JSON", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest("{"))).rejects.toBeInstanceOf(SyntaxError);
  });

  it("rejects payloads larger than the analytics ceiling", async () => {
    const oversized = JSON.stringify({ path: "/about", padding: "x".repeat(MAX_ANALYTICS_JSON_BYTES) });
    await expect(parseAnalyticsPayload(analyticsRequest(oversized))).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
