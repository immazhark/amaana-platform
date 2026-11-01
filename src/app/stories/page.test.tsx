import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ index: vi.fn(), cards: vi.fn() }));
vi.mock("@/lib/public-discovery-data", () => ({ getStoriesDiscoveryIndexData: mocks.index, getVisibleStoryCards: mocks.cards }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
import StoriesPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.index.mockResolvedValue([{ id: "synthetic", slug: "synthetic", title: "Synthetic story", summary: "Public archive", cause: { title: "Synthetic programme", status: "PUBLISHED" } }]);
  mocks.cards.mockResolvedValue([]);
});

it.each([{ q: "x".repeat(81) }, { programme: "unknown" }, { q: ["one", "two"] }])("associates invalid filter recovery with both controls: %j", async search => {
  const html = renderToStaticMarkup(await StoriesPage({ searchParams: Promise.resolve(search) }));
  expect(html).toContain('id="story-search-error" role="status"');
  for (const id of ["story-search", "story-programme"]) {
    const control = html.match(new RegExp(`<(?:input|select) id="${id}"[^>]*>`))?.[0];
    expect(control).toContain('aria-invalid="true"');
    expect(control).toContain('aria-describedby="story-search-help story-search-error"');
  }
  expect(html).toContain('id="story-search-help"');
  expect(html).toContain("Clear the filters or use a search of up to 80 characters");
});

it("keeps only privacy help associated with valid filters", async () => {
  const html = renderToStaticMarkup(await StoriesPage({ searchParams: Promise.resolve({ q: "Public", programme: "Synthetic programme" }) }));
  expect(html).not.toContain("story-search-error");
  expect(html).not.toContain('aria-invalid="true"');
  expect(html.match(/aria-describedby="story-search-help"/g)).toHaveLength(2);
});
