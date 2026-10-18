import { beforeEach, describe, expect, it, vi } from "vitest";

const reader = vi.hoisted(() => ({ read: vi.fn() }));

vi.mock("./bounded-request-body", async importOriginal => {
  const actual = await importOriginal<typeof import("./bounded-request-body")>();
  return { ...actual, readTextBodyWithLimit: reader.read };
});

import { MAX_ANALYTICS_JSON_BYTES, parseAnalyticsPayload } from "./analytics-ingestion";
import { MAX_WEB_VITAL_JSON_BYTES, parseWebVitalPayload } from "./web-vitals-ingestion";
import { RequestBodyReadTimeoutError } from "./bounded-request-body";

beforeEach(() => {
  vi.resetAllMocks();
});

const request = (endpoint: string) => new Request(`https://amaanafoundation.org/api/analytics/${endpoint}`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});

describe("anonymous telemetry ingress resource bounds", () => {
  it("limits public page-view body reads to five seconds without changing path anonymization", async () => {
    reader.read.mockResolvedValueOnce(JSON.stringify({ path: "/appeals/synthetic-medical-case" }));
    await expect(parseAnalyticsPayload(request("page-view")))
      .resolves.toEqual({ path: "/appeals/:slug" });
    expect(reader.read).toHaveBeenCalledExactlyOnceWith(expect.any(Request), MAX_ANALYTICS_JSON_BYTES, { timeoutMs: 5_000 });
  });

  it("limits Core Web Vitals body reads to five seconds without changing grouping", async () => {
    reader.read.mockResolvedValueOnce(JSON.stringify({ path: "/appeals/synthetic-medical-case", name: "LCP", value: 1200 }));
    await expect(parseWebVitalPayload(request("web-vitals")))
      .resolves.toEqual({ path: "/appeals/:slug", name: "LCP", bucket: "excellent" });
    expect(reader.read).toHaveBeenCalledExactlyOnceWith(expect.any(Request), MAX_WEB_VITAL_JSON_BYTES, { timeoutMs: 5_000 });
  });

  it.each([
    ["page-view", () => parseAnalyticsPayload(request("page-view"))],
    ["web-vitals", () => parseWebVitalPayload(request("web-vitals"))],
  ])("%s fails closed on a stalled request body", async (_name, parse) => {
    reader.read.mockRejectedValueOnce(new RequestBodyReadTimeoutError());
    await expect(parse()).rejects.toBeInstanceOf(RequestBodyReadTimeoutError);
    expect(reader.read).toHaveBeenCalledTimes(1);
  });
});
