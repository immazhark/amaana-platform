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

  it("rejects sensitive and malformed public paths", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/request-assistance" })))).resolves.toBeNull();
    await expect(parseAnalyticsPayload(analyticsRequest(JSON.stringify({ path: "/our-work/not valid" })))).resolves.toBeNull();
  });

  it("rejects malformed JSON", async () => {
    await expect(parseAnalyticsPayload(analyticsRequest("{"))).rejects.toBeInstanceOf(SyntaxError);
  });

  it("rejects payloads larger than the analytics ceiling", async () => {
    const oversized = JSON.stringify({ path: "/about", padding: "x".repeat(MAX_ANALYTICS_JSON_BYTES) });
    await expect(parseAnalyticsPayload(analyticsRequest(oversized))).rejects.toBeInstanceOf(RequestBodyTooLargeError);
  });
});
