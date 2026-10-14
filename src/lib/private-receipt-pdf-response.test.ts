import { describe, expect, it } from "vitest";
import { privateReceiptPdfResponse } from "./private-receipt-pdf-response";

const reference = "AFD-2026-12345678";
const bytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF\n");

describe("private receipt PDF transport boundary", () => {
  it("serves only a private attachment with a sanitized fixed-pattern filename", async () => {
    const res = privateReceiptPdfResponse({ bytes, reference });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toBe(`attachment; filename="amaana-acknowledgement-${reference}.pdf"`);
    expect(res.headers.get("content-length")).toBe(String(bytes.byteLength));
    expect(res.headers.get("cache-control")).toMatch(/private.*no-store/);
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(res.headers.get("x-robots-tag")).toContain("noindex");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toBe("sandbox");
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });
  it.each([
    "../admin", "hello\r\nSet-Cookie: evil", "has space",
    "x".repeat(81), "short", "bad/child",
  ])("never reflects an unsafe filename or reference: %s", bad => {
    expect(() => privateReceiptPdfResponse({ bytes, reference: bad })).toThrow();
  });
  it.each([
    new Uint8Array(0),
    new Uint8Array(15),
    new Uint8Array(2 * 1024 * 1024 + 1),
    new TextEncoder().encode("<html>not a PDF</html>"),
    new TextEncoder().encode("%PDF-1.7\nnot a complete document"),
    new TextEncoder().encode("%PDF-9.9\ncontent\n%%EOF"),
  ])("rejects missing, oversized or non-PDF renderer output", invalid => {
    expect(() => privateReceiptPdfResponse({ bytes: invalid, reference })).toThrow();
  });
  it("copies bytes into the response so the original buffer can be modified safely", async () => {
    const mutable = Uint8Array.from(bytes);
    const res = privateReceiptPdfResponse({ bytes: mutable, reference });
    mutable.fill(0);
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(bytes);
  });
});
