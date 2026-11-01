import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ content: vi.fn(), visibleMedia: vi.fn() }));
vi.mock("@/lib/public-discovery-data", () => ({
  getFaithDiscoveryData: mocks.content,
  getVisibleFaithMedia: mocks.visibleMedia,
}));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => null }));
import FaithPage from "./page";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.visibleMedia.mockResolvedValue([]);
  mocks.content.mockResolvedValue([
    { id: "one", slug: "one", title: "Synthetic article", excerpt: "Reviewed service", type: "ARTICLE", topics: [] },
    { id: "two", slug: "two", title: "Synthetic reminder", excerpt: "Reviewed gratitude", type: "REMINDER", topics: [] },
  ]);
});
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

it("requests image candidates only for the hero and current filtered lead", async () => {
  await FaithPage({ searchParams: Promise.resolve({ q: "gratitude", format: "REMINDER" }) });
  expect(mocks.visibleMedia).toHaveBeenCalledOnce();
  expect(mocks.visibleMedia).toHaveBeenCalledWith(["one", "two"]);

  mocks.visibleMedia.mockClear();
  await FaithPage({ searchParams: Promise.resolve({ q: "no-match" }) });
  expect(mocks.visibleMedia).toHaveBeenCalledOnce();
  expect(mocks.visibleMedia).toHaveBeenCalledWith(["one"]);

  mocks.visibleMedia.mockClear();
  mocks.content.mockResolvedValue([]);
  await FaithPage({ searchParams: Promise.resolve({}) });
  expect(mocks.visibleMedia).toHaveBeenCalledOnce();
  expect(mocks.visibleMedia).toHaveBeenCalledWith([]);
});
