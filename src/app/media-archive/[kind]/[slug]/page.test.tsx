import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ archive: vi.fn() }));
vi.mock("@/lib/public-media-archive", async importOriginal => ({
  ...await importOriginal<typeof import("@/lib/public-media-archive")>(),
  getPublicMediaArchive: mocks.archive,
}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND"); } }));
import Page, { metadata } from "./page";
beforeEach(() => {
  mocks.archive.mockReset();
  mocks.archive.mockResolvedValue({ slug: "approved-programme", title: "Approved programme", hasNext: true, media: [{
    id: "photo", kind: "IMAGE", publicUrl: "/media/synthetic.webp", externalUrl: null,
    title: null, altText: "Volunteers preparing kits", caption: null, sourceYear: 2026,
  }] });
});
it("renders accessible forward/back page links and lazy, non-preloaded real gallery markup", async () => {
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ kind: "initiative", slug: "approved-programme" }), searchParams: Promise.resolve({ page: "3" }) }));
  expect(html).toContain('aria-label="Media archive pages"');
  expect(html).toContain('aria-current="page"');
  expect(html).toContain('/media-archive/initiative/approved-programme?page=2');
  expect(html).toContain('/media-archive/initiative/approved-programme?page=4');
  expect(html).toContain('loading="lazy"');
  expect(html).not.toContain('rel="preload"');
  expect(html).toContain('alt="Volunteers preparing kits"');
});
it("does not render a previous or extra next page at the archive boundaries", async () => {
  mocks.archive.mockResolvedValue({ slug: "reviewed-story", title: "Reviewed story", media: [], hasNext: false });
  const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ kind: "story", slug: "reviewed-story" }), searchParams: Promise.resolve({}) }));
  expect(html).toContain('href="/stories/reviewed-story"');
  expect(html).not.toContain('Previous page');
  expect(html).not.toContain('Next page');
});
it("rejects duplicate page parameters without reading the archive", async () => {
  await expect(Page({ params: Promise.resolve({ kind: "story", slug: "reviewed-story" }), searchParams: Promise.resolve({ page: ["1", "2"] }) })).rejects.toThrow("NOT_FOUND");
  expect(mocks.archive).not.toHaveBeenCalled();
});
it("returns not found for withheld media and keeps archive pages out of search indexes", async () => {
  mocks.archive.mockResolvedValue(null);
  await expect(Page({ params: Promise.resolve({ kind: "story", slug: "withheld" }), searchParams: Promise.resolve({}) })).rejects.toThrow("NOT_FOUND");
  expect(metadata.robots).toEqual({ index: false, follow: true });
});
