import { describe, expect, it } from "vitest";
import { renderNotificationEmail } from "./notification-templates";

describe("notification email templates", () => {
  it("marks donation messages as normal acknowledgements", () => {
    const email = renderNotificationEmail("donation-acknowledgement", { referenceNumber: "AMN-123" });
    expect(email.text).toContain("not an 80G tax certificate");
    expect(email.html).toContain("AMN-123");
  });


  it("renders refund notifications with only the approved transaction summary", () => {
    const email = renderNotificationEmail("donation-refund-processed", {
      referenceNumber: "AFD-2026-12345678",
      refundAmount: "₹250",
      refundState: "partial refund",
    });

    expect(email.subject).toMatch(/refund processed/i);
    expect(email.text).toContain("partial refund");
    expect(email.text).toContain("₹250");
    expect(email.text).toContain("AFD-2026-12345678");
    expect(email.html).not.toContain("card");
    expect(email.html).not.toContain("bank account");
  });

  it("escapes untrusted template values", () => {
    const email = renderNotificationEmail("assistance-request-received", { referenceNumber: "<script>alert(1)</script>" });
    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&lt;script&gt;");
  });

  it("rejects unknown templates", () => {
    expect(() => renderNotificationEmail("unknown", {})).toThrow("Unsupported notification template");
  });
});
