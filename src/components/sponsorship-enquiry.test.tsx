import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

import { SponsorshipEnquiry } from "./sponsorship-enquiry";

describe("education sponsorship campaign entry", () => {
  it("does not signal a failed enquiry before any preference was selected", () => {
    const html = renderToStaticMarkup(<SponsorshipEnquiry preferences={{
      utm_source: "campaign", gclid: "click-token",
    }} />);
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Open email with these preferences");
    expect(html).not.toContain("click-token");
  });
  it("retains the first-party education CTA preselection and visitor-owned email", () => {
    const html = renderToStaticMarkup(<SponsorshipEnquiry preferences={{
      path: "hifdh", support: "discuss", utm_campaign: "taleem",
    }} />);
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Open email with these preferences");
    expect(html).toContain("mailto:amaanafoundation24@gmail.com");
  });
  it("rejects injected private fields without exposing them", () => {
    const html = renderToStaticMarkup(<SponsorshipEnquiry preferences={{
      path: "hifdh", support: "discuss", childName: "PRIVATE_STUDENT",
    }} />);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("PRIVATE_STUDENT");
  });
});
