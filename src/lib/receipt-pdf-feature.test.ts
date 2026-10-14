import { afterEach, describe, expect, it, vi } from "vitest";
import { isPrivateReceiptPdfEnabled } from "./receipt-pdf-feature";

afterEach(() => vi.unstubAllEnvs());

describe("shared private receipt PDF rollout gate", () => {
  it("stays disabled by default, without key or renderer", () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", "false");
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", undefined);
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", undefined);
    expect(isPrivateReceiptPdfEnabled()).toBe(false);
  });
  it("requires all three independent settings simultaneously", () => {
    vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", "true");
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "a1".repeat(32));
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "/verified/weasyprint");
    expect(isPrivateReceiptPdfEnabled()).toBe(true);
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "weasyprint");
    expect(isPrivateReceiptPdfEnabled()).toBe(false);
    vi.stubEnv("AMAANA_RECEIPT_PDF_RENDERER_BIN", "/verified/weasyprint");
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "short");
    expect(isPrivateReceiptPdfEnabled()).toBe(false);
    vi.stubEnv("RECEIPT_DOWNLOAD_ENCRYPTION_KEY", "a1".repeat(32));
    vi.stubEnv("AMAANA_RECEIPT_PDF_ENABLED", "TRUE");
    expect(isPrivateReceiptPdfEnabled()).toBe(false);
  });
});
