import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ faith: vi.fn() }));

vi.mock("@/lib/public-page-data", () => ({ getFaithPageData: mocks.faith }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) =>
    createElement("a", { href }, children),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/components/page-hero", () => ({
  PageHero: ({ eyebrow }: { eyebrow: string }) => createElement("header", { "data-hero-eyebrow": eyebrow }),
}));
vi.mock("@/components/section-heading", () => ({ SectionHeading: () => createElement("h2") }));
vi.mock("@/components/public-content-structured-data", () => ({ PublicContentStructuredData: () => null }));
vi.mock("@/components/breadcrumb-structured-data", () => ({ BreadcrumbStructuredData: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => null }));
vi.mock("@/lib/public-media", () => ({
  canRenderPublicMedia: () => false,
  resolvePublicMediaUrl: () => null,
  selectIdentityPublicImage: () => null,
}));

import FaithDetailPage from "./page";

const faith = {
  slug: "synthetic-verified-reflection",
  title: "Synthetic reviewed reflection",
  excerpt: "Test-only reviewed excerpt",
  body: "Test-only reviewed body",
  type: "ARTICLE",
  publishedAt: new Date("2026-10-26T19:00:00.000Z"),
  verifiedAt: new Date("2026-10-26T19:00:00.000Z"),
  updatedAt: new Date("2026-10-26T19:00:00.000Z"),
  sourceCitation: null,
  topics: [],
  mediaAssets: [],
  initiative: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.faith.mockResolvedValue(faith);
});

describe("Faith detail IST date displays", () => {
  it("renders publication and religious review dates in Asia/Kolkata at the UTC midnight boundary", async () => {
    // Fix the simulated server default to UTC, regardless of the test host.
    // Explicit page time zones still override this fallback.
    const NativeDateTimeFormat = Intl.DateTimeFormat;
    const fallback = vi.spyOn(Intl, "DateTimeFormat").mockImplementation(function utcDefault(locales, options) {
      return new NativeDateTimeFormat(locales, { timeZone: "UTC", ...options });
    });
    let html: string;
    try {
      html = renderToStaticMarkup(await FaithDetailPage({
        params: Promise.resolve({ slug: faith.slug }),
      }));
    } finally {
      fallback.mockRestore();
    }

    expect(html).toContain('data-hero-eyebrow="article · 27 October 2026"');
    expect(html).toContain("Religious review verified 27 October 2026.");
    expect(html).not.toContain("Religious review verified 26 October 2026.");
  });
});
