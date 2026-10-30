import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ appeal: vi.fn(), privacy: vi.fn(), share: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({
  getAppealPageData: mocks.appeal,
  getAppealCoverMedia: () => null,
}));
vi.mock("@/lib/appeal-search-privacy", () => ({ getAppealSearchPrivacy: mocks.privacy }));
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: ReactNode; href: string }) =>
    createElement("a", { ...props, href }, children),
}));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
}));
vi.mock("@/components/page-hero", () => ({
  PageHero: () => createElement("div", { "data-hero": "true" }),
}));
vi.mock("@/components/work-visual-placeholder", () => ({
  WorkVisualPlaceholder: () => createElement("div"),
}));
vi.mock("@/components/appeal-share", () => ({
  AppealShare: (props: { title: string; summary: string }) => {
    mocks.share(props);
    return createElement("div");
  },
}));
vi.mock("@/components/section-heading", () => ({
  SectionHeading: () => createElement("h2"),
}));
vi.mock("@/components/mobile-support-bar", () => ({
  MobileSupportBar: () => createElement("div"),
}));

import AppealPage, { generateMetadata } from "./page";

const appeal = {
  slug: "reviewed-medical-appeal",
  title: "Sensitive beneficiary identity in reviewed title",
  summary: "Reviewed private medical circumstances",
  status: "CLOSED",
  coverImageUrl: null,
  beneficiaryLocation: null,
  beneficiaryDisplayName: null,
  category: "MEDICAL",
  amountRaised: { toNumber: () => 100 },
  goalAmount: { toNumber: () => 200 },
  publishedAt: new Date("2026-10-01T00:00:00Z"),
  story: "A public-safe approved story",
  updates: [],
};
const params = { params: Promise.resolve({ slug: appeal.slug }) };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.appeal.mockResolvedValue(appeal);
  mocks.privacy.mockResolvedValue("STANDARD");
});

async function breadcrumbName() {
  const html = renderToStaticMarkup(await AppealPage(params));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  const breadcrumbs = scripts.map(match => JSON.parse(match[1] || "{}"))
    .find(data => data["@type"] === "BreadcrumbList");
  expect(breadcrumbs).toBeDefined();
  return breadcrumbs.itemListElement[2].name as string;
}

describe("appeal breadcrumb privacy parity", () => {
  it("does not repeat the identifiable appeal title in highly sensitive JSON-LD breadcrumbs", async () => {
    mocks.privacy.mockResolvedValue("HIGHLY_SENSITIVE");
    expect(await breadcrumbName()).toBe("Verified Support Appeal");
  });

  it("does not prefill confidential title or summary into a social share link", async () => {
    mocks.privacy.mockResolvedValue("HIGHLY_SENSITIVE");
    renderToStaticMarkup(await AppealPage(params));
    expect(mocks.share).toHaveBeenCalledWith({
      title: "Verified Support Appeal",
      summary: "A privacy-sensitive verified support appeal from Amaana Foundation. Public details are intentionally limited.",
      path: `/appeals/${appeal.slug}`,
    });
  });

  it("shares normal published appeal copy without replacing reviewed text", async () => {
    renderToStaticMarkup(await AppealPage(params));
    expect(mocks.share).toHaveBeenCalledWith({
      title: appeal.title,
      summary: appeal.summary,
      path: `/appeals/${appeal.slug}`,
    });
  });

  it("keeps a reviewed non-sensitive title in its normal breadcrumb", async () => {
    expect(await breadcrumbName()).toBe(appeal.title);
  });

  it("uses the same generic title in highly sensitive metadata and breadcrumbs", async () => {
    mocks.privacy.mockResolvedValue("HIGHLY_SENSITIVE");
    const metadata = await generateMetadata(params);
    expect(metadata.title).toBe("Verified Support Appeal");
    expect(metadata.robots).toEqual({ index: false, follow: true, nocache: true });
    expect(await breadcrumbName()).toBe(metadata.title);
  });
});


describe("appeal field-update display dates", () => {
  it("shows the India calendar day even when the server default is UTC", async () => {
    const original = Date.prototype.toLocaleDateString;
    const formatter = vi.spyOn(Date.prototype, "toLocaleDateString").mockImplementation(function (
      this: Date, locales, options,
    ) {
      return original.call(this, locales, { ...options, timeZone: options?.timeZone ?? "UTC" });
    });
    try {
      mocks.appeal.mockResolvedValue({ ...appeal, updates: [{
        id: "synthetic-update", title: "Synthetic update", content: "Synthetic reviewed update",
        publishedAt: new Date("2026-10-26T19:00:00Z"),
      }] });
      const html = renderToStaticMarkup(await AppealPage(params));
      expect(html).toContain("<small>27 October 2026</small>");
      expect(html).not.toContain("<small>26 October 2026</small>");
    } finally {
      formatter.mockRestore();
    }
  });

  it("keeps an undated update visible without inventing a publication date", async () => {
    mocks.appeal.mockResolvedValue({ ...appeal, updates: [{
      id: "synthetic-undated", title: "Synthetic undated update", content: "Synthetic reviewed update",
      publishedAt: null,
    }] });
    const html = renderToStaticMarkup(await AppealPage(params));
    expect(html).toContain("<small></small><h3>Synthetic undated update</h3>");
    expect(html).not.toContain("Invalid Date");
  });
});
