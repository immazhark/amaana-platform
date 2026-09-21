import { describe, expect, it } from "vitest";
import { renderNotificationEmail } from "./notification-templates";

describe("notification email templates", () => {
  it("marks donation messages as normal acknowledgements", () => {
    const email = renderNotificationEmail("donation-acknowledgement", { referenceNumber: "AMN-123", givingIntent: "ZAKAT" });
    expect(email.text).toContain("not an 80G tax certificate");
    expect(email.text).toContain("Giving intention: Zakat");
    expect(email.html).toContain("AMN-123");
    expect(email.html).toContain("Zakat");
  });


  it("renders the controlled operational acceptance without sensitive case data", () => {
    const email = renderNotificationEmail("operational-email-acceptance", {
      acceptanceType: "transactional-email",
    });

    expect(email.subject).toMatch(/transactional email acceptance/i);
    expect(email.text).toContain("controlled transactional-email acceptance");
    expect(email.text).toContain("no donor, beneficiary, payment or assistance-case data");
    expect(email.html).not.toContain("reference");
    expect(email.html).not.toContain("card");
    expect(email.html).not.toContain("bank account");
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
