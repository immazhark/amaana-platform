import { beforeEach, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ records: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getAppealsIndexData: mocks.records, getCompletedAidShowcaseData: async () => [], getDonationImpactHighlights: async () => [] }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/verified-impact-strip", () => ({ VerifiedImpactStrip: () => null }));
vi.mock("@/components/appeal-card", () => ({ AppealCard: ({ appeal }: { appeal: { title: string } }) => <article>{appeal.title}</article> }));
vi.mock("@/lib/public-environment", () => ({ canExposeSyntheticStagingContent: () => false, isSyntheticStagingAppeal: (appeal: { slug: string }) => appeal.slug.startsWith("synthetic-") }));
import AppealsPage from "./page";
const open = { status: "PUBLISHED", goalAmount: 1000, amountRaised: 0, closesAt: null };
beforeEach(() => mocks.records.mockResolvedValue([
  { ...open, slug: "winter", title: "Winter support", summary: "Blankets" },
  { ...open, slug: "education", title: "Education support", summary: "School" },
  { ...open, slug: "synthetic-test", title: "Synthetic hidden support", summary: "Blankets" },
  { ...open, slug: "closed", status: "CLOSED", title: "Closed hidden support", summary: "Blankets" },
  { ...open, slug: "draft", status: "DRAFT", title: "Draft hidden support", summary: "Blankets" },
  { ...open, slug: "funded", amountRaised: 1000, title: "Funded hidden support", summary: "Blankets" },
  { ...open, slug: "expired", closesAt: new Date("2000-01-01"), title: "Expired hidden support", summary: "Blankets" },
]));
it("searches only eligible production appeals and labels the GET form", async () => {
  const html = renderToStaticMarkup(await AppealsPage({ searchParams: Promise.resolve({ q: "blankets" }) }));
  expect(html).toContain("Winter support");
  for (const text of ["Education support", "Synthetic hidden support", "Closed hidden support", "Draft hidden support", "Funded hidden support", "Expired hidden support"]) expect(html).not.toContain(text);
  expect(html).toContain('for="appeal-search"');
  expect(html).toContain('id="appeal-search"');
  expect(html).toContain('method="get"');
});
it("does not reflect rejected query values into the actual public page", async () => {
  const html = renderToStaticMarkup(await AppealsPage({ searchParams: Promise.resolve({ q: "PRIVATE\nDETAIL" }) }));
  expect(html).not.toContain("PRIVATE");
  expect(html).toContain('aria-invalid="true"');
  expect(html).toContain('role="status"');
});
it("distinguishes search misses from no eligible appeals", async () => {
  const render = async () => renderToStaticMarkup(await AppealsPage({ searchParams: Promise.resolve({ q: "missing" }) }));
  expect(await render()).toContain("No active appeals match this search");
  mocks.records.mockResolvedValue([]);
  expect(await render()).toContain("No Public Appeal Is Open Right Now");
});
