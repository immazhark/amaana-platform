import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, ...props }: ComponentProps<"a">) => (
    <a {...props} data-next-link="true">{children}</a>
  ),
}));

import { ParticipationCards, type ParticipationPath } from "./participation-card";

const paths: ParticipationPath[] = [
  { marker: "01", title: "Email", copy: "General questions", action: "Email Amaana", href: "mailto:amaanafoundation24@gmail.com?subject=Hello" },
  { marker: "02", title: "Phone", copy: "Telephone questions", action: "Call Amaana", href: "tel:+919908002694" },
  { marker: "03", title: "Request assistance", copy: "Private intake", action: "Request support", href: "/request-assistance" },
  { marker: "04", title: "Social", copy: "Official social profile", action: "Visit profile", href: "https://www.instagram.com/amaanafoundation/" },
];

describe("participation card destination semantics", () => {
  it("does not render participation links with unsafe or malformed runtime destinations", () => {
    const unsafe = [
      "javascript:alert('private')",
      "data:text/html,<script>alert(1)</script>",
      "http://insecure.example.invalid",
      "//external.example.invalid/path",
      "/\\\\external.example.invalid",
      "https://user:password@example.invalid/path",
      "https://example.invalid/\nmalformed",
      "  /contact  ",
      "",
      null,
    ];
    const invalidPaths = unsafe.map((href, index) => ({
      ...paths[2]!,
      marker: `unsafe-${index}`,
      title: `Reject unsafe destination ${index}`,
      href,
    })) as unknown as ParticipationPath[];
    const html = renderToStaticMarkup(<ParticipationCards paths={[paths[2]!, paths[0]!, paths[1]!, paths[3]!, ...invalidPaths]} />);
    expect(html).toContain('href="/request-assistance"');
    expect(html).toContain('href="mailto:amaanafoundation24@gmail.com');
    expect(html).toContain('href="tel:+919908002694"');
    expect(html).toContain('href="https://www.instagram.com/amaanafoundation/"');
    expect(html).not.toContain("Reject unsafe destination");
    expect(html).not.toContain("javascript:");
    expect(html).not.toContain("data:text/html");
    expect(html).not.toContain("insecure.example.invalid");
  });

  it("uses native anchors for email and telephone actions while keeping SPA links internal", () => {
    const html = renderToStaticMarkup(<ParticipationCards paths={paths} />);
    const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
    expect(anchors).toHaveLength(4);
    const email = anchors.find(anchor => anchor.includes("mailto:amaanafoundation24@gmail.com"));
    const phone = anchors.find(anchor => anchor.includes("tel:+919908002694"));
    const internal = anchors.find(anchor => anchor.includes('href="/request-assistance"'));
    const external = anchors.find(anchor => anchor.includes("https://www.instagram.com/amaanafoundation/"));

    expect(email).toBeDefined();
    expect(phone).toBeDefined();
    expect(email).not.toContain("data-next-link");
    expect(phone).not.toContain("data-next-link");

    expect(internal).toContain('data-next-link="true"');
    expect(internal).not.toContain('target="_blank"');

    expect(external).not.toContain("data-next-link");
    expect(external).toContain('target="_blank"');
    expect(external).toContain('rel="noopener noreferrer"');
  });
});
