import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ content: vi.fn(), media: vi.fn() }));
vi.mock("@/lib/public-discovery-data", () => ({ getFaithDiscoveryData: mocks.content, getVisibleFaithMedia: mocks.media }));
vi.mock("@/components/page-hero", () => ({ PageHero: ({ visual }: { visual?: import("react").ReactNode }) => <header>{visual}</header> }));
vi.mock("@/components/public-media", () => ({ PublicMedia: ({ asset }: { asset: { id: string } }) => <span data-media={asset.id} /> }));
import FaithPage from "./page";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.media.mockResolvedValue([]);
  mocks.content.mockResolvedValue([
  { id: "one", slug: "one", title: "Synthetic article", excerpt: "Reviewed service", type: "ARTICLE", topics: [{ topic: { slug: "service", name: "Synthetic full-library theme" } }], mediaAssets: [] },
  { id: "two", slug: "two", title: "Synthetic reminder", excerpt: "Reviewed gratitude", type: "REMINDER", topics: [], mediaAssets: [] },
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

it("requests only stable hero and filtered lead media while retaining full-library themes", async () => {
  const image = (id: string) => ({ id, kind: "IMAGE", publicUrl: `/synthetic-${id}.webp`, altText: `Synthetic ${id}`, sortOrder: -1000 });
  mocks.media.mockResolvedValue([{ id: "one", mediaAssets: [image("hero")] }, { id: "two", mediaAssets: [image("lead")] }]);
  const html = renderToStaticMarkup(await FaithPage({ searchParams: Promise.resolve({ q: "gratitude" }) }));
  expect(mocks.media).toHaveBeenCalledWith(["one", "two"]);
  expect(html).toContain('data-media="hero"');
  expect(html).toContain('data-media="lead"');
  expect(html).toContain("Synthetic full-library theme");
  expect(html).toContain("2 verified items");
});
it("never reuses index media if a previously selected record is withdrawn", async () => {
  const staleMedia = [{ id: "stale", kind: "IMAGE", publicUrl: "/synthetic-stale.webp", altText: "Synthetic stale image", sortOrder: -1000 }];
  mocks.content.mockResolvedValue([{ id: "two", slug: "two", title: "Synthetic reminder", excerpt: "Reviewed gratitude", type: "REMINDER", topics: [], mediaAssets: staleMedia }]);
  mocks.media.mockResolvedValue([]);
  const html = renderToStaticMarkup(await FaithPage({ searchParams: Promise.resolve({ q: "gratitude" }) }));
  expect(html).not.toContain("data-media=");
  expect(html).toContain("Visual media appears only when separately approved");
});

it("deduplicates an unfiltered hero/lead and skips media work for an empty library", async () => {
  await FaithPage({ searchParams: Promise.resolve({}) });
  expect(mocks.media).toHaveBeenLastCalledWith(["one"]);
  mocks.content.mockResolvedValue([]);
  await FaithPage({ searchParams: Promise.resolve({}) });
  expect(mocks.media).toHaveBeenLastCalledWith([]);
});
