import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import { IDENTITY_MEDIA_SORT_ORDER } from "@/lib/public-media";

const mocks = vi.hoisted(() => ({ causes: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { cause: { findMany: mocks.causes } } }));
vi.mock("@/components/page-hero", () => ({ PageHero: ({ visual }: { visual: ReactNode }) => <header>{visual}</header> }));
vi.mock("@/components/verified-impact-strip", () => ({ VerifiedImpactStrip: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: ({ asset }: { asset: { id: string } }) => <span data-image={asset.id} /> }));
import OurWorkPage from "./page";

const image = (id: string, overrides: Record<string, unknown> = {}) => ({
  id, kind: "IMAGE", publicUrl: `/synthetic-${id}.webp`, altText: "Synthetic programme image", sortOrder: IDENTITY_MEDIA_SORT_ORDER, ...overrides,
});

beforeEach(() => vi.resetAllMocks());

function projectCandidates(candidates: ReturnType<typeof image>[]) {
  mocks.causes.mockImplementation(async query => {
    // Model the actual database take rather than returning every candidate.
    const media = query.select.initiatives.select.mediaAssets;
    expect(query.where).toEqual({ status: "PUBLISHED" });
    expect(query.select.initiatives.where).toEqual({ status: "PUBLISHED" });
    expect(media.where).toEqual({ kind: "IMAGE", isPublic: true, privacyApprovedAt: { not: null }, publicUrl: { not: null }, altText: { not: "" }, sortOrder: IDENTITY_MEDIA_SORT_ORDER });
    return [{ initiatives: [{ id: "synthetic", slug: "dates-distribution", title: "Synthetic programme", summary: "Synthetic public portfolio", year: null, startYear: null, endYear: null, primaryMetric: null, primaryMetricLabel: null, mediaAssets: candidates.slice(0, media.take) }] }];
  });
}

it.each([
  { altText: "   " },
  { publicUrl: "/admin/private-image" },
  { publicUrl: "javascript:alert(1)" },
])("retains a usable approved identity image after an unusable newer candidate: %j", async invalid => {
  projectCandidates([image("rejected", invalid), image("approved-fallback")]);
  const html = renderToStaticMarkup(await OurWorkPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('data-image="approved-fallback"');
  expect(html).not.toContain('data-image="rejected"');
  const projection = mocks.causes.mock.calls[0]?.[0].select.initiatives.select.mediaAssets;
  expect(projection.take).toBe(12);
});

it("keeps the existing visual fallback when all identity candidates fail rendering guards", async () => {
  projectCandidates([image("rejected", { altText: "   " })]);
  const html = renderToStaticMarkup(await OurWorkPage({ searchParams: Promise.resolve({}) }));
  expect(html).not.toContain("data-image=");
  expect(html).toContain("Documented public portfolio");
});
