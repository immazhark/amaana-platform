import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ index: vi.fn(), cards: vi.fn() }));
vi.mock("@/lib/public-discovery-data", () => ({ getStoriesDiscoveryIndexData: mocks.index, getVisibleStoryCards: mocks.cards }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
import StoriesPage from "./(overview)/page";

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

it("uses the same approved programme labels in visible feature and archive cards", async () => {
  const records = [
    { id: "a", slug: "field-note-a", title: "School field note", summary: "Public summary",
      cause: null, initiative: { title: "Annual edition", status: "PUBLISHED",
        cause: { title: "Education", status: "PUBLISHED" } }, mediaAssets: [] },
    { id: "b", slug: "field-note-b", title: "Relief field note", summary: "Public summary",
      cause: { title: "Relief", status: "PUBLISHED" },
      initiative: { title: "Unrelated edition", status: "PUBLISHED",
        cause: { title: "   ", status: "PUBLISHED" } }, mediaAssets: [] },
  ];
  mocks.index.mockResolvedValue(records);
  mocks.cards.mockResolvedValue(records);
  const html = renderToStaticMarkup(await StoriesPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain("<small>Education</small>");
  expect(html).toContain("<small>Relief</small>");
  expect(html).not.toContain("<small>Annual edition</small>");
  expect(html).not.toContain("<small>Unrelated edition</small>");
});

it("does not display draft cause names or whitespace-only labels on published story cards", async () => {
  const records = [
    { id: "a", slug: "reviewed-a", title: "Reviewed field note", summary: "Published summary",
      cause: { title: "Internal cause", status: "DRAFT" },
      initiative: { title: "Internal initiative", status: "DRAFT",
        cause: { title: "Private programme", status: "PUBLISHED" } }, mediaAssets: [] },
    { id: "b", slug: "reviewed-b", title: "Another field note", summary: "Published summary",
      cause: { title: "  ", status: "PUBLISHED" }, mediaAssets: [] },
  ];
  mocks.index.mockResolvedValue(records);
  mocks.cards.mockResolvedValue(records);
  const html = renderToStaticMarkup(await StoriesPage({ searchParams: Promise.resolve({}) }));
  expect(html.match(/<small>Story of Amanah<\/small>/g)).toHaveLength(2);
  expect(html).not.toContain("Internal cause");
  expect(html).not.toContain("Internal initiative");
  expect(html).not.toContain("Private programme");
  expect(html).not.toContain("<small>  </small>");
});
