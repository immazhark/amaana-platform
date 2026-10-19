import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getRecord: vi.fn(),
  getChildren: vi.fn(),
}));

vi.mock("@/lib/public-content", () => ({
  getPublishedInitiativeBySlug: mocks.getRecord,
  PUBLIC_DETAIL_MEDIA_LIMIT: 48,
}));
vi.mock("@/lib/public-page-data", () => ({ getProgrammeChildMedia: mocks.getChildren }));
vi.mock("@/lib/master-copy", () => ({
  programmeBySlug: () => null,
  programmeChildren: () => [],
}));
vi.mock("./programme-next", () => ({ ProgrammeNext: () => null }));
vi.mock("@/components/programme-artwork", () => ({
  ProgrammeArtwork: () => null,
  hasProgrammeArtwork: () => false,
}));
vi.mock("@/lib/initiative-banner-media", () => ({ selectInitiativeBannerImage: () => null }));
vi.mock("@/components/page-hero", () => ({ PageHero: () => null }));
vi.mock("@/components/work-visual-placeholder", () => ({ WorkVisualPlaceholder: () => null }));
vi.mock("@/components/section-heading", () => ({ SectionHeading: () => null }));
vi.mock("@/components/body-carousel", () => ({ BodyCarousel: () => null }));
vi.mock("@/components/campaign-media-gallery", () => ({ CampaignMediaGallery: () => null }));
vi.mock("@/components/public-media", () => ({ PublicMedia: () => null }));
vi.mock("@/components/breadcrumb-structured-data", () => ({ BreadcrumbStructuredData: () => null }));
vi.mock("@/components/public-content-structured-data", () => ({ PublicContentStructuredData: () => null }));
vi.mock("@/lib/public-copy", () => ({
  buildPublicRecordFallback: () => "Documented",
  programmeStoryParagraphs: () => ["Documented work"],
  heroTeaser: () => "Documented work",
}));
vi.mock("@/lib/public-media", () => ({
  canRenderPublicMedia: () => true,
  resolvePublicMediaUrl: (asset: { publicUrl: string }) => asset.publicUrl,
  getPublicImageOptimizationUrl: (url: string) => url,
  selectGalleryPublicImage: () => null,
  selectIdentityPublicImage: () => null,
}));
vi.mock("next/navigation", () => ({
  notFound: () => { throw new Error("NOT_FOUND"); },
}));

import { ProgrammeDetail } from "./programme-detail";

function recordWithMedia(count: number) {
  return {
    id: "approved-initiative",
    slug: "approved-programme",
    title: "Approved programme",
    summary: "Reviewed programme copy",
    story: "Reviewed evidence",
    cause: { title: "Community programmes" },
    primaryMetric: null,
    primaryMetricLabel: null,
    mediaAssets: Array.from({ length: count }, (_, index) => ({
      id: `public-${index}`,
      kind: "IMAGE",
      title: null,
      publicUrl: `/media/approved-${index}.webp`,
      altText: "Approved field photograph",
      caption: null,
      width: 800,
      height: 600,
    })),
  };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getChildren.mockResolvedValue([]);
});

describe("canonical programme reviewed-media archive", () => {
  it("links to the paginated archive when the initial 48 approved media are filled", async () => {
    mocks.getRecord.mockResolvedValue(recordWithMedia(48));
    const html = renderToStaticMarkup(await ProgrammeDetail({ slug: "approved-programme" }));
    expect(html).toContain('href="/media-archive/initiative/approved-programme"');
    expect(html).toContain("Browse the complete approved media archive");
  });

  it("does not advertise an archive below the bounded-media threshold", async () => {
    mocks.getRecord.mockResolvedValue(recordWithMedia(47));
    const html = renderToStaticMarkup(await ProgrammeDetail({ slug: "approved-programme" }));
    expect(html).not.toContain("/media-archive/initiative/");
  });
});
