import { describe, expect, it } from "vitest";
import { RequestBodyTooLargeError } from "./bounded-request-body";
import {
  MAX_WEB_VITAL_JSON_BYTES,
  classifyWebVital,
  parseWebVitalPayload,
  webVitalThresholds,
} from "./web-vitals-ingestion";

function request(payload: unknown) {
  return new Request("https://amaanafoundation.org/api/analytics/web-vitals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("anonymous Core Web Vitals ingestion", () => {
  it("accepts only a public route and recognized metric", async () => {
    await expect(parseWebVitalPayload(request({ path: "/our-work", name: "LCP", value: 980 })))
      .resolves.toEqual({ path: "/our-work", name: "LCP", bucket: "excellent" });
    await expect(parseWebVitalPayload(request({ path: "/appeals", name: "CLS", value: 0.2 })))
      .resolves.toEqual({ path: "/appeals", name: "CLS", bucket: "needsImprovement" });
  });

  it.each([
    { path: "/admin", name: "INP", value: 75 },
    { path: "/donations/private/acknowledgement", name: "CLS", value: 0.1 },
    { path: "/request-assistance/status", name: "LCP", value: 900 },
    { path: "/our-work?token=private", name: "LCP", value: 900 },
    { path: "/about", name: "TTFB", value: 100 },
    { path: "/about", name: "INP", value: -1 },
    { path: "/about", name: "INP", value: 120001 },
    { path: "/about", name: "CLS", value: 10.01 },
    { path: "/about", name: "INP", value: "200" },
    { path: "/about", name: "LCP", value: 850, userId: "private" },
  ])("rejects unapproved or malformed payload %#", async payload => {
    await expect(parseWebVitalPayload(request(payload))).resolves.toBeNull();
  });

  it("enforces bounded request size before parsing", async () => {
    const payload = { path: "/about", name: "LCP", value: 900, padding: "x".repeat(MAX_WEB_VITAL_JSON_BYTES) };
    await expect(parseWebVitalPayload(request(payload))).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });

  it("uses honest published CWV thresholds with stricter Amaana targets", () => {
    expect(webVitalThresholds.LCP).toMatchObject({ excellent: 1200, good: 2500, poor: 4000 });
    expect(webVitalThresholds.INP).toMatchObject({ excellent: 50, good: 200, poor: 500 });
    expect(webVitalThresholds.CLS).toMatchObject({ excellent: 0.05, good: 0.1, poor: 0.25 });
    expect(classifyWebVital("LCP", 1200)).toBe("excellent");
    expect(classifyWebVital("LCP", 2500)).toBe("good");
    expect(classifyWebVital("LCP", 4000)).toBe("needsImprovement");
    expect(classifyWebVital("LCP", 4001)).toBe("poor");
    expect(classifyWebVital("INP", 50)).toBe("excellent");
    expect(classifyWebVital("INP", 200)).toBe("good");
    expect(classifyWebVital("CLS", 0.05)).toBe("excellent");
    expect(classifyWebVital("CLS", 0.25)).toBe("needsImprovement");
    expect(classifyWebVital("CLS", Number.NaN)).toBeNull();
  });
});
