import { describe, expect, it } from "vitest";
import { renderPrivateReceiptHtml } from "./private-receipt-pdf-html";

const receipt = {
  found: true as const,
  presentation: { tone: "captured" as const, heading: "Verified", summary: "Record", statusLabel: "Captured" },
  donation: {
    referenceNumber: "AFD-2026-12345678", receiptNumber: "ACK-2026-12345678",
    donorName: "محمد మజర్ <script>alert('x')</script>",
    givingIntent: "GENERAL", amount: 100.30, refundedAmount: 0.10,
    designationKind: "APPEAL" as const, recordDate: "2026-10-15T00:00:00.000Z",
    providerPaymentId: "pay_synthetic", appeal: { title: "Original approved cause", slug: null },
  },
};

describe("private receipt PDF HTML rendering", () => {
  it("preserves multilingual donor names without interpreting donor markup", () => {
    const html = renderPrivateReceiptHtml(receipt);
    expect(html).toContain("محمد మజర్");
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;alert(&#39;x&#39;)&lt;/script&gt;");
    expect(html).toContain('dir="auto"');
    expect(html).not.toMatch(/<link|<img|<iframe|https?:\/\//i);
  });
  it("preserves exact paise, original designation and statutory distinction", () => {
    const html = renderPrivateReceiptHtml(receipt);
    expect(html).toContain("₹100.30");
    expect(html).toContain("₹0.10");
    expect(html).toContain("Original approved cause");
    expect(html).toContain("Section 80G");
    expect(html).toContain("not a statutory Form 10BE certificate");
  });
  it("renders fund language without inventing a public appeal link", () => {
    const html = renderPrivateReceiptHtml({ ...receipt,
      donation: { ...receipt.donation, designationKind: "FUND", appeal: { title: "Approved Sadaqah Fund", slug: null } },
    });
    expect(html).toContain("Designated giving fund");
    expect(html).toContain("Approved Sadaqah Fund");
    expect(html).not.toContain("href=");
  });
  it.each(["pending", "failed"])("rejects %s financial claims", tone => {
    expect(() => renderPrivateReceiptHtml({ ...receipt,
      presentation: { ...receipt.presentation, tone: tone as "pending" | "failed" },
    })).toThrow();
  });
  it("rejects unreceipted or inconsistent refund records", () => {
    expect(() => renderPrivateReceiptHtml({ ...receipt,
      donation: { ...receipt.donation, receiptNumber: null },
    })).toThrow();
    expect(() => renderPrivateReceiptHtml({ ...receipt,
      donation: { ...receipt.donation, refundedAmount: 999 },
    })).toThrow();
  });
  it("rejects sub-paise and unsafe monetary totals", () => {
    for (const amount of [100.001, Number.MAX_SAFE_INTEGER, Infinity]) {
      expect(() => renderPrivateReceiptHtml({ ...receipt, donation: { ...receipt.donation, amount } })).toThrow();
    }
  });
});
