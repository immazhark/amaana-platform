import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ data: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getImpactPageData: mocks.data }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/body-carousel", () => ({ BodyCarousel: () => null }));
vi.mock("@/components/verified-impact-strip", () => ({ VerifiedImpactStrip: () => null }));
vi.mock("@/lib/master-copy", () => ({
  programmeBySlug: (slug: string) => slug === "synthetic-initiative" ? { causeSlug: "synthetic-programme" } : undefined,
  programmeCategories: [{ slug: "synthetic-programme", title: "Synthetic programme" }],
}));
import ImpactPage from "./page";

beforeEach(() => mocks.data.mockResolvedValue([{
  id: "synthetic", slug: "synthetic-initiative", title: "Synthetic initiative", summary: "Synthetic outcome", mediaAssets: [], cause: { title: "Synthetic programme" },
}]));

it.each([{ programme: "unknown" }, { programme: ["synthetic-programme", "unknown"] }])("describes rejected Impact filters on the programme control: %j", async search => {
  const html = renderToStaticMarkup(await ImpactPage({ searchParams: Promise.resolve(search) }));
  const control = html.match(/<select id="impact-programme"[^>]*>/)?.[0];
  expect(control).toContain('aria-invalid="true"');
  expect(control).toContain('aria-describedby="impact-filter-error"');
  expect(html).toContain('id="impact-filter-error" role="status"');
  expect(html).toContain("Select a published programme or clear the impact filter.");
  expect(html).not.toContain('value="unknown"');
});

it.each([{}, { programme: "synthetic-programme" }])("keeps valid filters free of stale error descriptions: %j", async search => {
  const html = renderToStaticMarkup(await ImpactPage({ searchParams: Promise.resolve(search) }));
  expect(html).not.toContain("impact-filter-error");
  expect(html).not.toContain('aria-invalid="true"');
  expect(html).toContain('for="impact-programme"');
  expect(html).toContain("Synthetic initiative");
});

it.each([
  { primaryMetric: "   ", primaryMetricLabel: "kits" },
  { primaryMetric: "25", primaryMetricLabel: "  " },
])("does not present incomplete quantities as documented Impact wall facts: %j", async metric => {
  mocks.data.mockResolvedValueOnce([{
    id: "synthetic", slug: "synthetic-initiative", title: "Synthetic initiative",
    summary: "Synthetic outcome", mediaAssets: [], cause: { title: "Synthetic programme" },
    ...metric,
  }]);
  const html = renderToStaticMarkup(await ImpactPage({ searchParams: Promise.resolve({}) }));
  expect(html).not.toContain("<strong>   </strong>");
  expect(html).not.toContain("<strong>25</strong>");
  expect(html).toContain("<span>Synthetic initiative</span>");
});
