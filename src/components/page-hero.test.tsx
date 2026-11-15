import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props} data-next-link="true">{children}</a>
  ),
}));

import { PageHero } from "./page-hero";

const hero = (actions: unknown) => renderToStaticMarkup(
  <PageHero
    variant="information"
    eyebrow="Synthetic review"
    title="A reviewed destination"
    description={<p>Read the source before acting.</p>}
    actions={actions as Parameters<typeof PageHero>[0]["actions"]}
  />,
);

describe("PageHero public action destinations", () => {
  it("keeps reviewed in-site, anchor, email, phone and secure links usable", () => {
    const html = hero([
      { label: "View public work", href: "/our-work" },
      { label: "Review payable appeal", href: "/donate/reviewed-example" },
      { label: "Track existing request", href: "/request-assistance/status" },
      { label: "Read evidence", href: "#evidence" },
      { label: "Email Amaana", href: "mailto:amaanafoundation24@gmail.com" },
      { label: "Call Amaana", href: "tel:+919908002694" },
      { label: "Visit official channel", href: "https://www.instagram.com/amaanafoundation/" },
    ]);
    for (const label of ["View public work", "Review payable appeal", "Track existing request", "Read evidence", "Email Amaana", "Call Amaana", "Visit official channel"]) {
      expect(html).toContain(label);
    }
    expect(html).toContain('data-next-link="true"');
    expect(html).toContain('href="#evidence"');
    expect(html).toContain('href="/request-assistance/status"');
    expect(html).toContain('href="mailto:amaanafoundation24@gmail.com"');
    expect(html).toContain('href="tel:+919908002694"');
    expect(html).toContain('href="https://www.instagram.com/amaanafoundation/"');
  });

  it("never renders malformed, private or untrusted runtime actions", () => {
    const blocked: unknown[] = [
      { label: "JS payload", href: "javascript:alert(1)" },
      { label: "HTML payload", href: "data:text/html,invalid" },
      { label: "Insecure site", href: "http://example.invalid" },
      { label: "Protocol relative", href: "//example.invalid" },
      { label: "Private admin", href: "/admin" },
      { label: "Private API", href: "/api/private" },
      { label: "Private receipt", href: "/request-assistance/received" },
      { label: "Private nested tracking", href: "/request-assistance/status/arbitrary-token" },
      { label: "Encoded private", href: "/%61dmin" },
      { label: "Credentials", href: "https://user:secret@example.invalid" },
      { label: "Trailing space", href: "/contact " },
      { label: "Line break", href: "https://example.invalid/\nroute" },
      { label: "Empty email", href: "mailto:" },
      { label: "Empty phone", href: "tel:" },
      { label: "Missing href" },
      { label: "Object href", href: { route: "/our-work" } },
      { label: "", href: "/our-work" },
      null,
    ];
    const html = hero([{ label: "Reviewed route", href: "/our-work" }, ...blocked]);
    expect(html).toContain("Reviewed route");
    for (const action of blocked) {
      if (action && typeof action === "object" && "label" in action && typeof action.label === "string" && action.label) {
        expect(html).not.toContain(action.label);
      }
    }
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("example.invalid");
  });

  it("fails closed for malformed action collections without suppressing the hero", () => {
    for (const actions of [null, "not-a-collection", { 0: { label: "Wrong", href: "/our-work" }, length: 1 }]) {
      const html = hero(actions);
      expect(html).toContain("A reviewed destination");
      expect(html).not.toContain("Wrong");
    }
  });
});
