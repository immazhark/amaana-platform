import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/section-heading", () => ({ SectionHeading: () => null }));
vi.mock("@/components/assistance-form", () => ({
  AssistanceForm: ({ copy }: { copy: { termsNotice: ReactNode } }) => <>{copy.termsNotice}</>,
}));
vi.mock("@/components/canonical-article", () => ({
  CanonicalArticle: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import RequestAssistancePage from "./request-assistance/page";
import RecognitionPage from "./recognition/page";

function linkMarkup(html: string, href: string): string {
  const links = [...html.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/g)];
  const link = links.map(match => match[0]).find(value => value.includes(`href="${href}"`));
  expect(link, `Expected link to ${href}`).toBeDefined();
  return link ?? "";
}

function expectAnnouncedNewTab(link: string, visibleText: string) {
  expect(link).toContain('target="_blank"');
  expect(link).toContain('rel="noreferrer"');
  expect(link).toContain(visibleText);
  expect(link).toMatch(/<span class="sr-only">\s*\(opens in a new tab\)<\/span>/);
}

describe("public links that open a new tab", () => {
  it("announces the context change for assistance terms and privacy without changing their links", () => {
    const html = renderToStaticMarkup(<RequestAssistancePage />);
    expectAnnouncedNewTab(linkMarkup(html, "/terms"), "assistance and platform terms");
    expectAnnouncedNewTab(linkMarkup(html, "/privacy"), "privacy notice");
  });

  it("announces the context change for the recognition certificate PDF", () => {
    const html = renderToStaticMarkup(<RecognitionPage />);
    const link = linkMarkup(html, "/documents/amp-certificate-excellence-2025.pdf");
    expect(link).toContain('target="_blank"');
    expect(link).toContain('rel="noopener noreferrer"');
    expect(link).toContain("Open original certificate");
    expect(link).toMatch(/<span class="sr-only">\s*\(opens in a new tab\)<\/span>/);
  });
});
