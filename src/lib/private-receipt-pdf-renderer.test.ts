import { afterEach, describe, expect, it, vi } from "vitest";
import { renderPrivateReceiptPdf } from "./private-receipt-pdf-renderer";

const record = {
  found: true as const,
  presentation: { tone: "captured" as const, heading: "Verified", summary: "Record", statusLabel: "Captured" },
  donation: {
    referenceNumber: "AFD-2026-12345678", receiptNumber: "ACK-2026-12345678",
    donorName: "محمد మజర్", givingIntent: "GENERAL", amount: 100.30, refundedAmount: 0.10,
    designationKind: "APPEAL" as const, recordDate: "2026-10-15T00:00:00.000Z",
    providerPaymentId: "pay_synthetic", appeal: { title: "Synthetic appeal", slug: "synthetic-appeal" },
  },
};

afterEach(() => vi.unstubAllEnvs());

describe("private Unicode PDF renderer", () => {
  it("fails closed when the reviewed binary is not provisioned", async () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", undefined);
    await expect(renderPrivateReceiptPdf(record)).rejects.toThrow(/not configured/);
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "weasyprint");
    await expect(renderPrivateReceiptPdf(record)).rejects.toThrow(/not configured/);
  });
  it("rejects unsettled records before invoking the renderer", async () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "/path/not-provisioned");
    await expect(renderPrivateReceiptPdf({ ...record,
      presentation: { ...record.presentation, tone: "failed" },
    })).rejects.toThrow(/Only settled/);
  });
});

const binary = process.env.AMAANA_PDF_TEST_RUNTIME;
describe.skipIf(!binary)("optional real Unicode PDF/UA integration", () => {
  it("generates a bounded native PDF with a reviewed external renderer", async () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", binary);
    const bytes = await renderPrivateReceiptPdf(record);
    expect(bytes.byteLength).toBeGreaterThan(1024);
    expect(bytes.byteLength).toBeLessThan(2 * 1024 * 1024);
    expect(new TextDecoder().decode(bytes.subarray(0, 8))).toMatch(/^%PDF-1\./);
    expect(new TextDecoder().decode(bytes.subarray(-64))).toContain("%%EOF");
  }, 25000);
});
