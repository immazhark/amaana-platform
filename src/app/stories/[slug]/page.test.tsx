import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ story: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getStoryPageData: mocks.story }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => createElement("a", { href }, children),
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
vi.mock("@/components/page-hero", () => ({
  PageHero: ({ eyebrow }: { eyebrow: string }) => createElement("header", null, eyebrow),
}));

import StoryPage from "./page";

afterEach(() => {
  vi.unstubAllEnvs();
  mocks.story.mockReset();
});

it("keeps a reviewed story public without leaking an invalid related initiative", async () => {
  mocks.story.mockResolvedValue({
    slug: "synthetic-reviewed-story",
    title: "Synthetic reviewed field note",
    summary: "Approved summary",
    body: "Approved narrative",
    sourceNote: null,
    publishedAt: null,
    updatedAt: new Date("2026-11-12T00:00:00.000Z"),
    mediaAssets: [],
    initiative: { status: "PUBLISHED", title: "Synthetic unchecked initiative", slug: "unchecked", cause: null },
    cause: { status: "DRAFT", title: "Private unpublished programme" },
  });
  const html = renderToStaticMarkup(await StoryPage({ params: Promise.resolve({ slug: "synthetic-reviewed-story" }) }));
  expect(html).toContain("Approved narrative");
  expect(html).not.toContain("Private unpublished programme");
  expect(html).not.toContain("Synthetic unchecked initiative");
  expect(html).not.toContain("View this initiative");
});

it("shows the Asia/Kolkata publication day in the public Story hero", async () => {
  vi.stubEnv("TZ", "UTC");
  mocks.story.mockResolvedValue({
    slug: "synthetic-reviewed-story",
    title: "Synthetic field note",
    summary: "Synthetic public summary",
    body: "Synthetic public account",
    sourceNote: null,
    publishedAt: new Date("2026-10-26T20:00:00.000Z"),
    updatedAt: new Date("2026-10-26T20:00:00.000Z"),
    mediaAssets: [],
    cause: null,
    initiative: null,
  });

  const html = renderToStaticMarkup(await StoryPage({ params: Promise.resolve({ slug: "synthetic-reviewed-story" }) }));
  expect(html).toContain("Stories of Amanah · 27 October 2026");
  expect(html).not.toContain("Stories of Amanah · 26 October 2026");
});
