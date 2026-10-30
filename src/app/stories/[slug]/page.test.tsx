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
