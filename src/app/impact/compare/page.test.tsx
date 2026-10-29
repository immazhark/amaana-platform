import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ data: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getImpactComparisonPageData: mocks.data }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/lib/master-copy", () => ({
  programmeBySlug: (slug: string) => (slug === "relief" || slug === "education")
    ? { causeSlug: "relief" } : undefined,
}));
import ImpactComparisonPage from "./page";

beforeEach(() => mocks.data.mockResolvedValue([
  { id: "relief", slug: "relief", title: "Relief initiative",
    summary: "Approved public detail", primaryMetric: "  ",
    primaryMetricLabel: "kits", cause: { title: "Relief" } },
  { id: "education", slug: "education", title: "Education initiative",
    summary: "Approved public detail", primaryMetric: "25",
    primaryMetricLabel: "students", cause: { title: "Education" } },
]));

it("shows a no-quantity explanation instead of whitespace impact and preserves valid comparison facts", async () => {
  const html = renderToStaticMarkup(await ImpactComparisonPage({
    searchParams: Promise.resolve({ left: "relief", right: "education" }),
  }));
  expect(html).toContain("No headline quantity has been published for this initiative.");
  expect(html).not.toContain("<strong>  </strong>");
  expect(html).toContain("<strong>25</strong> — students");
  expect(html).toContain("/our-work/relief");
  expect(html).toContain("/our-work/education");
});

it("does not invent a label for an otherwise populated quantity", async () => {
  mocks.data.mockResolvedValueOnce([
    { id: "relief", slug: "relief", title: "Relief initiative",
      summary: "Approved public detail", primaryMetric: "500",
      primaryMetricLabel: "  ", cause: { title: "Relief" } },
    { id: "education", slug: "education", title: "Education initiative",
      summary: "Approved public detail", primaryMetric: "25",
      primaryMetricLabel: "students", cause: { title: "Education" } },
  ]);
  const html = renderToStaticMarkup(await ImpactComparisonPage({
    searchParams: Promise.resolve({ left: "relief", right: "education" }),
  }));
  expect(html).not.toContain("<strong>500</strong>");
  expect(html).toContain("A complete headline outcome is not available for this initiative.");
  expect(html).not.toContain("<strong>500</strong> — Documented outcome");
});
