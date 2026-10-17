import { describe, expect, it } from "vitest";
import { buildVolunteerEnquiryHref, VOLUNTEER_SKILLS } from "./volunteer-enquiry";

describe("private-first volunteer contact builder", () => {
  it("creates a useful opt-in email without sending or persisting any personal data", () => {
    const href = buildVolunteerEnquiryHref(
      ["Technology and website support", "Distribution and packing"], "Weekends",
    );
    const url = new URL(href);
    expect(url.protocol).toBe("mailto:");
    expect(url.pathname).toBe("amaanafoundation24@gmail.com");
    const body = url.searchParams.get("body") ?? "";
    expect(body).toContain("Technology and website support");
    expect(body).toContain("Weekends");
    expect(body).toContain("not a confirmed placement");
    expect(body).not.toContain("password");
    expect(body).not.toContain("PAN");
  });
  it("keeps a useful general enquiry without any skill or availability selection", () => {
    const href = buildVolunteerEnquiryHref([], "");
    const body = new URL(href).searchParams.get("body") ?? "";
    expect(body).toContain("Open to discussing available needs");
    expect(body).toContain("Not specified");
  });
  it("whitelists categories and does not include untrusted input in mailto URLs", () => {
    const injected = "Sensitive personal details\nBCC: example@example.com";
    const href = buildVolunteerEnquiryHref(
      [injected as (typeof VOLUNTEER_SKILLS)[number]],
      injected as "Weekends",
    );
    expect(decodeURIComponent(href)).not.toContain(injected);
    expect(new URL(href).searchParams.get("body")).toContain("Not specified");
  });
  it("cannot duplicate skill names supplied repeatedly", () => {
    const href = buildVolunteerEnquiryHref(
      ["Event logistics", "Event logistics"], "Occasionally",
    );
    expect((new URL(href).searchParams.get("body") ?? "").match(/Event logistics/g)).toHaveLength(1);
  });
});
