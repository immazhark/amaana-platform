import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => <a {...props}>{children}</a>,
}));

import { VolunteerInterestBuilder } from "./volunteer-interest-builder";

describe("volunteer campaign entry and reviewed preferences", () => {
  it("does not display a false validation error on attribution-only inbound visits", () => {
    const html = renderToStaticMarkup(<VolunteerInterestBuilder preferences={{
      utm_source: "community", fbclid: "external-token",
    }} />);
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("Open prepared email");
    expect(html).not.toContain("external-token");
  });
  it("retains invalid-choice feedback after an explicit malformed review", () => {
    const html = renderToStaticMarkup(<VolunteerInterestBuilder preferences={{
      intent: "review", skill: "PRIVATE_NAME",
    }} />);
    expect(html).toContain('role="alert"');
    expect(html).not.toContain("PRIVATE_NAME");
  });
  it("retains visitor-owned native email after valid explicit selections", () => {
    const html = renderToStaticMarkup(<VolunteerInterestBuilder preferences={{
      intent: "review", skill: "Event logistics", availability: "Weekends",
      utm_medium: "community",
    }} />);
    expect(html).not.toContain('role="alert"');
    expect(html).toContain("Open prepared email");
    expect(html).toContain("mailto:amaanafoundation24@gmail.com");
  });
});
