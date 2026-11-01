import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/section-heading", () => ({ SectionHeading: () => null }));

import { CanonicalArticle } from "./canonical-article";

const renderWith = (pathways: { label: string; href: string; description: string }[]) =>
  renderToStaticMarkup(createElement(CanonicalArticle, {
    title: "Verified public information",
    intro: "A public page.",
    eyebrow: "Amaana",
    blocks: [],
    pathways,
  }));

describe("CanonicalArticle internal pathway navigation", () => {
  it("rejects a backslash that the browser treats as an external authority separator", () => {
    const unsafe = "/\\attacker.example/collect";
    expect(new URL(unsafe, "https://amaanafoundation.org").origin).toBe("https://attacker.example");
    const html = renderWith([
      { label: "Untrusted destination", href: unsafe, description: "Must not render" },
      { label: "Safe work page", href: "/our-work", description: "Still visible" },
    ]);
    expect(html).not.toContain("attacker.example");
    expect(html).toContain('href="/our-work"');
  });

  it("rejects control characters while retaining safe fragment and query links", () => {
    const html = renderWith([
      { label: "Control character", href: "/contact\u0000outside", description: "Must not render" },
      { label: "Other origin", href: "//attacker.example", description: "Must not render" },
      { label: "Safe contact", href: "/contact#enquiry", description: "Visible" },
      { label: "Safe query", href: "/our-work?type=education", description: "Visible" },
    ]);
    expect(html).not.toContain("Control character");
    expect(html).not.toContain("Other origin");
    expect(html).toContain('href="/contact#enquiry"');
    expect(html).toContain('href="/our-work?type=education"');
  });

  it("retains deduplication for unchanged internal destinations", () => {
    const html = renderWith([
      { label: "One", href: "/our-work", description: "First" },
      { label: "Two", href: "/our-work", description: "Second" },
    ]);
    expect(html.match(/href="\/our-work"/g)).toHaveLength(1);
  });
});
