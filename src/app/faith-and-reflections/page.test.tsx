import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ content: vi.fn() }));
vi.mock("@/lib/public-discovery-data", () => ({ getFaithDiscoveryData: mocks.content }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => null }));
import FaithPage from "./page";
beforeEach(() => mocks.content.mockResolvedValue([
  { id: "one", slug: "one", title: "Synthetic article", excerpt: "Reviewed service", type: "ARTICLE", topics: [], mediaAssets: [] },
  { id: "two", slug: "two", title: "Synthetic reminder", excerpt: "Reviewed gratitude", type: "REMINDER", topics: [], mediaAssets: [] },
]));
it("filters reviewed entries while preserving the full-library count", async () => {
  const html = renderToStaticMarkup(await FaithPage({ searchParams: Promise.resolve({ q: "gratitude", format: "REMINDER" }) }));
  expect(html).toContain("Synthetic reminder");
  expect(html).not.toContain("Synthetic article");
  expect(html).toContain("2 verified items");
  expect(html).toContain('for="faith-search"');
  expect(html).toContain('id="faith-search"');
});
it("distinguishes no matches from an unpublished library and clears rejected values", async () => {
  const html = renderToStaticMarkup(await FaithPage({ searchParams: Promise.resolve({ q: "PRIVATE\nVALUE" }) }));
  expect(html).not.toContain("PRIVATE");
  expect(html).toContain("No reviewed items match these filters");
  mocks.content.mockResolvedValue([]);
  expect(renderToStaticMarkup(await FaithPage({ searchParams: Promise.resolve({}) }))).toContain("Reviewed faith content will appear here when it is ready.");
});
