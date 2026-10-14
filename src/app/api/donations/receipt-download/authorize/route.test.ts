import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  origin: vi.fn(), limiter: vi.fn(), issue: vi.fn(),
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: mocks.origin,
  enforceAcknowledgementRateLimit: mocks.limiter,
}));
vi.mock("@/lib/verified-receipt-download", () => ({
  issueVerifiedReceiptDownloadGrant: mocks.issue,
}));
import { POST } from "./route";

const reference = "AFD-2026-12345678";
const token = "synthetic-private-token-012345678901234";
const body = { reference, token };
function request(data: unknown = body, origin = "https://amaana.example") {
  return new Request("https://amaana.example/api/donations/receipt-download/authorize", {
    method: "POST", headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", "true");
  vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "a1".repeat(32));
  vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "/verified/weasyprint");
  mocks.origin.mockReturnValue(true);
  mocks.limiter.mockResolvedValue(true);
  mocks.issue.mockResolvedValue("rd1.encrypted.synthetic.tag");
});

afterEach(() => vi.unstubAllEnvs());

describe("gated private receipt-download authorization route", () => {
  it.each(["false", "TRUE", "", undefined])("never reads private data with feature switch %s", async flag => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", flag);
    const result = await POST(request());
    expect(result.status).toBe(404);
    expect(mocks.origin).not.toHaveBeenCalled();
    expect(mocks.limiter).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it.each(["", "bad", undefined])("does not activate without a valid independent key: %s", async key => {
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", key);
    const result = await POST(request());
    expect(result.status).toBe(404);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("refuses grant issuance when the PDF renderer is not configured", async () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "");
    const result = await POST(request());
    expect(result.status).toBe(404);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("rejects a cross-origin request before private lookup", async () => {
    mocks.origin.mockReturnValue(false);
    const result = await POST(request());
    expect(result.status).toBe(403);
    expect(mocks.limiter).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it.each([
    { ...body, extra: true }, { ...body, reference: "../admin" },
    { ...body, token: "too-short" }, { ...body, token: "x".repeat(301) },
    { ...body, token: ["synthetic"] }, [],
  ])("rejects noncanonical inputs before private lookup: %j", async invalid => {
    const result = await POST(request(invalid));
    expect(result.status).toBe(404);
    expect(mocks.limiter).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("rejects malformed JSON before a private lookup", async () => {
    const result = await POST(new Request("https://amaana.example/api/donations/receipt-download/authorize", {
      method: "POST", headers: { Origin: "https://amaana.example" }, body: "{",
    }));
    expect(result.status).toBe(404);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("bounds actual streamed JSON bytes, not just Content-Length", async () => {
    const response = await POST(request({ ...body, padding: "x".repeat(2000) }));
    expect(response.status).toBe(413);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(mocks.limiter).not.toHaveBeenCalled();
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("enforces receipt-specific rate-limit before issuing any grant", async () => {
    mocks.limiter.mockResolvedValue(false);
    const result = await POST(request());
    expect(result.status).toBe(429);
    expect(mocks.issue).not.toHaveBeenCalled();
    expect(result.headers.get("cache-control")).toContain("no-store");
  });
  it("only returns a short-lived encrypted grant after positive verification", async () => {
    const result = await POST(request());
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      available: true, grant: "rd1.encrypted.synthetic.tag", expiresInSeconds: 300,
    });
    expect(mocks.issue).toHaveBeenCalledExactlyOnceWith(body);
    expect(result.headers.get("cache-control")).toContain("private");
    expect(result.headers.get("referrer-policy")).toBe("no-referrer");
    expect(result.headers.get("x-robots-tag")).toContain("noindex");
    expect(result.headers.get("x-content-type-options")).toBe("nosniff");
    expect(result.headers.get("location")).toBeNull();
  });
  it("responds generically to rejected or failed receipt proof", async () => {
    mocks.issue.mockResolvedValueOnce(null);
    const missing = await POST(request());
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ available: false });
    mocks.issue.mockRejectedValueOnce(new Error("private database details"));
    const failing = await POST(request());
    expect(failing.status).toBe(404);
    expect(JSON.stringify(await failing.json())).not.toContain("private database");
  });
});
