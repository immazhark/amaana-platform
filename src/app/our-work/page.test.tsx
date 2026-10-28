import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getWork: vi.fn() }));
vi.mock("@/lib/public-page-data", () => ({ getOurWorkIndexData: mocks.getWork }));
vi.mock("@/components/page-hero", () => ({ PageHero: ({ visual }: { visual: ReactNode }) => <aside>{visual}</aside> }));
vi.mock("@/components/verified-impact-strip", () => ({ VerifiedImpactStrip: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => null }));

import OurWorkPage from "./page";

function initiative(slug: string, year: number | null, startYear: number | null = null, endYear: number | null = null) {
  return { id: slug, slug, title: slug, summary: "Reviewed programme", year, startYear, endYear,
    primaryMetric: null, primaryMetricLabel: null, mediaAssets: [] };
}

beforeEach(() => {
  mocks.getWork.mockResolvedValue([{ initiatives: [
    initiative("dates-distribution", null, 2026, 2026),
    initiative("dates-distribution-2026", 2026),
    initiative("taleem", null),
    initiative("taleem-initiative-2025", 2025),
  ] }]);
});

async function render(search: Record<string, string> = {}) {
  return renderToStaticMarkup(await OurWorkPage({ searchParams: Promise.resolve(search) }));
}

function resultLinks(html: string) {
  return [...html.matchAll(/id="([^"]+)" class="v2-initiative-row/g)].map(match => match[1]);
}

describe("published portfolio page", () => {
  it("offers a year present only in an edition while the overview shows umbrella programmes", async () => {
    const html = await render();
    expect(html).toContain('<option value="2025">2025</option>');
    expect(resultLinks(html)).toEqual(["dates-distribution", "taleem"]);
    expect(html).toContain("2 published programmes");
  });

  it("shows the requested edition once and keeps the overview count stable", async () => {
    const html = await render({ year: "2026" });
    expect(resultLinks(html)).toEqual(["dates-distribution-2026"]);
    expect(html).toContain("1 published initiative matching these filters.");
    expect(html).toContain("2 published programmes");
    expect(html).toContain('<option value="2025">2025</option>');
  });

  it("intersects programme and year without hiding the annual record", async () => {
    const html = await render({ programme: "amaana-taleem", year: "2025" });
    expect(resultLinks(html)).toEqual(["taleem-initiative-2025"]);
    expect(html).not.toContain("These filters could not be read");
  });

  it("does not reconstruct unpublished records from the canonical catalogue", async () => {
    mocks.getWork.mockResolvedValue([{ initiatives: [initiative("taleem-initiative-2025", 2025)] }]);
    const html = await render();
    expect(resultLinks(html)).toEqual(["taleem-initiative-2025"]);
    expect(html).not.toContain('id="taleem" class="v2-initiative-row');
  });

  it("rejects invalid queries without reflecting values or changing the overview", async () => {
    const html = await render({ year: "PRIVATE_VALUE" });
    expect(resultLinks(html)).toEqual([]);
    expect(html).not.toContain("PRIVATE_VALUE");
    expect(html).toContain("2 published programmes");
    expect(html).toContain("These filters could not be read");
  });
});


it("keeps a text-matching umbrella when the selected year's edition does not match", async () => {
  mocks.getWork.mockResolvedValue([{ initiatives: [
    { ...initiative("dates-distribution", null, 2025, 2026), summary: "Synthetic umbrella match" },
    { ...initiative("dates-distribution-2026", 2026), summary: "Annual edition" },
  ] }]);
  const html = await render({ q: "umbrella match", year: "2026" });
  expect(resultLinks(html)).toEqual(["dates-distribution"]);
  expect(html).toContain("1 published initiative matching these filters.");
});
