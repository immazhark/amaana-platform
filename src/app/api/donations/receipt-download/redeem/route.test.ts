import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  origin: vi.fn(), limiter: vi.fn(), redeem: vi.fn(), render: vi.fn(),
}));
vi.mock("@/lib/request-security", () => ({
  isSameOrigin: mocks.origin, enforceAcknowledgementRateLimit: mocks.limiter,
}));
vi.mock("@/lib/verified-receipt-download", () => ({
  redeemVerifiedReceiptDownloadGrant: mocks.redeem,
}));
vi.mock("@/lib/private-receipt-pdf-renderer", () => ({
  renderPrivateReceiptPdf: mocks.render,
}));
import { POST } from "./route";

const record = {
  found: true, presentation: { tone: "captured", heading: "Verified", summary: "Receipt", statusLabel: "Captured" },
  donation: { referenceNumber: "AFD-2026-12345678", receiptNumber: "ACK-2026",
    donorName: "Synthetic donor", givingIntent: "GENERAL", designationKind: "APPEAL",
    amount: 100.30, refundedAmount: 0, recordDate: "2026-10-15T00:00:00Z",
    providerPaymentId: "pay_synthetic", appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" } },
};
const grant = "rd1." + "a".repeat(16) + "." + "b".repeat(120) + "." + "c".repeat(22);
const bytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");
function request(input: unknown = { grant }, origin = "https://amaana.example") {
  return new Request("https://amaana.example/api/donations/receipt-download/redeem", {
    method: "POST",
    headers: { Origin: origin, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", "true");
  vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "a1".repeat(32));
  vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "/trusted/weasyprint");
  mocks.origin.mockReturnValue(true);
  mocks.limiter.mockResolvedValue(true);
  mocks.redeem.mockResolvedValue(record);
  mocks.render.mockResolvedValue(bytes);
});
afterEach(() => vi.unstubAllEnvs());

describe("private PDF grant redemption route", () => {
  it.each(["false", "TRUE", "", undefined])("is inert with flag %s", async flag => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", flag);
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(mocks.origin).not.toHaveBeenCalled();
    expect(mocks.limiter).not.toHaveBeenCalled();
    expect(mocks.redeem).not.toHaveBeenCalled();
  });
  it.each(["", "weasyprint", undefined])("requires an absolute provisioned renderer: %s", async binary => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", binary);
    expect((await POST(request())).status).toBe(404);
    expect(mocks.redeem).not.toHaveBeenCalled();
  });
  it("denies a cross-origin request before any private read", async () => {
    mocks.origin.mockReturnValue(false);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.limiter).not.toHaveBeenCalled();
  });
  it.each([{}, { grant: "short" }, { grant, extra: 1 }, { grant: "a".repeat(1700) }])(
    "rejects malformed or oversize credentials without private lookup: %j", async input => {
      expect((await POST(request(input))).status).toBe(JSON.stringify(input).length > 1600 ? 413 : 404);
      expect(mocks.redeem).not.toHaveBeenCalled();
    },
  );
  it("throttles before decrypting a receipt grant", async () => {
    mocks.limiter.mockResolvedValue(false);
    expect((await POST(request())).status).toBe(429);
    expect(mocks.redeem).not.toHaveBeenCalled();
  });
  it("returns no private data for expired or revoked grants", async () => {
    mocks.redeem.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ available: false });
    expect(mocks.render).not.toHaveBeenCalled();
  });
  it("rechecks grant then renders a PDF attachment with non-cacheable headers", async () => {
    const response = await POST(request());
    expect(mocks.redeem).toHaveBeenCalledExactlyOnceWith(grant);
    expect(mocks.render).toHaveBeenCalledExactlyOnceWith(record);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment;");
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(bytes);
  });
  it("returns a generic retryable failure rather than a fabricated PDF", async () => {
    mocks.render.mockRejectedValueOnce(new Error("private renderer failure"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ available: false });
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
