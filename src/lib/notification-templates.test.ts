import { describe, expect, it } from "vitest";
import { renderNotificationEmail } from "./notification-templates";

describe("notification email templates", () => {
  it("marks donation messages as normal acknowledgements", () => {
    const email = renderNotificationEmail("donation-acknowledgement", { referenceNumber: "AMN-123" });
    expect(email.text).toContain("not an 80G tax certificate");
    expect(email.html).toContain("AMN-123");
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
