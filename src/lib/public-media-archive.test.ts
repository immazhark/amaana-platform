import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ initiative: vi.fn(), story: vi.fn(), faith: vi.fn(), media: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  initiative: { findFirst: mocks.initiative }, story: { findFirst: mocks.story },
  faithContent: { findFirst: mocks.faith }, mediaAsset: { findMany: mocks.media },
} }));
import { getPublicMediaArchive, parsePublicArchivePage } from "./public-media-archive";

const parent = { id: "public-parent", slug: "approved-programme", title: "Approved programme", _count: { mediaAssets: 60 } };
const rows = Array.from({ length: 25 }, (_, index) => ({ id: `public-${index}`, kind: "IMAGE", publicUrl: `/media/${index}.webp`, altText: "Reviewed photograph" }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.initiative.mockResolvedValue(parent);
  mocks.story.mockResolvedValue(parent);
  mocks.faith.mockResolvedValue(parent);
  mocks.media.mockResolvedValue(rows);
});

describe("bounded published media archives", () => {
  it("excludes hosted videos until verified synchronized captions are supported", async () => {
    const { PUBLIC_DETAIL_MEDIA_PROJECTION } = await import("@/lib/public-content");
    // PublicMedia deliberately rejects VIDEO; it must not consume a page slot.
    expect(PUBLIC_DETAIL_MEDIA_PROJECTION.where.OR).not.toContainEqual({
      kind: "VIDEO", publicUrl: { not: null },
    });
    expect(PUBLIC_DETAIL_MEDIA_PROJECTION.where.OR).toContainEqual({
      kind: "EXTERNAL_VIDEO", externalUrl: { not: null },
    });
  });
  it("limits public detail media before serialization", async () => {
    const { PUBLIC_DETAIL_MEDIA_PROJECTION } = await import("@/lib/public-content");
    expect(PUBLIC_DETAIL_MEDIA_PROJECTION.take).toBe(48);
    expect(PUBLIC_DETAIL_MEDIA_PROJECTION.select).not.toHaveProperty("storageKey");
    expect(PUBLIC_DETAIL_MEDIA_PROJECTION.select).not.toHaveProperty("sourcePath");
  });
  it.each([undefined, "1", "2", "89478486"])("accepts valid page %s", value => {
    expect(parsePublicArchivePage(value)).toBe(value === undefined ? 1 : Number(value));
  });
  it.each(["0", "-1", "01", "1.5", "1e3", " 2", "2 ", "Infinity", "89478487", ["1", "2"]])("rejects ambiguous or unsafe page %s", value => {
    expect(parsePublicArchivePage(value)).toBeNull();
  });
  it("returns 24 records and a next-page flag without serializing parent IDs/counts", async () => {
    const result = await getPublicMediaArchive("initiative", parent.slug, 2);
    expect(result?.media).toHaveLength(24);
    expect(result?.hasNext).toBe(true);
    expect(result).not.toHaveProperty("id");
    expect(result).not.toHaveProperty("_count");
    const query = mocks.media.mock.calls[0]?.[0];
    expect(query.skip).toBe(24);
    expect(query.take).toBe(25);
    expect(query.where).toMatchObject({ isPublic: true, privacyApprovedAt: { not: null }, initiative: { id: parent.id, status: "PUBLISHED", cause: { status: "PUBLISHED" } } });
    expect(query.orderBy).toEqual([{ sortOrder: "asc" }, { sourceYear: "desc" }, { createdAt: "desc" }, { id: "asc" }]);
    for (const field of ["storageKey", "sourcePath", "privacyApprovedAt", "isPublic", "createdAt"]) expect(query.select).not.toHaveProperty(field);
  });
  it("exposes media beyond the former 48-row cap on page three", async () => {
    mocks.media.mockResolvedValue(rows.slice(0, 12));
    const result = await getPublicMediaArchive("initiative", parent.slug, 3);
    expect(mocks.media.mock.calls[0]?.[0].skip).toBe(48);
    expect(result?.media).toHaveLength(12);
    expect(result?.hasNext).toBe(false);
  });
  it.each(["initiative", "story", "faith"])("fails closed for an unpublished %s", async kind => {
    mocks.initiative.mockResolvedValue(null); mocks.story.mockResolvedValue(null); mocks.faith.mockResolvedValue(null);
    expect(await getPublicMediaArchive(kind, parent.slug, 1)).toBeNull();
    expect(mocks.media).not.toHaveBeenCalled();
  });
  it("retains story privacy approval in both parent and media queries", async () => {
    await getPublicMediaArchive("story", parent.slug, 1);
    expect(mocks.story.mock.calls[0]?.[0].where).toMatchObject({ status: "PUBLISHED", privacyApprovedAt: { not: null } });
    expect(mocks.media.mock.calls[0]?.[0].where.story).toMatchObject({ status: "PUBLISHED", privacyApprovedAt: { not: null } });
  });
  it("retains religious verification gates for faith media", async () => {
    await getPublicMediaArchive("faith", parent.slug, 1);
    const gate = { status: "PUBLISHED", religiousReviewStatus: "VERIFIED", verifiedAt: { not: null }, sourceCitation: { not: null } };
    expect(mocks.faith.mock.calls[0]?.[0].where).toMatchObject(gate);
    expect(mocks.media.mock.calls[0]?.[0].where.faithContent).toMatchObject(gate);
  });
  it("rejects huge out-of-range offsets before querying media", async () => {
    expect(await getPublicMediaArchive("initiative", parent.slug, 80_000_000)).toBeNull();
    expect(mocks.media).not.toHaveBeenCalled();
  });
  it.each([0, -1, NaN, Infinity, 1.5])("rejects invalid numeric page %s before database access", async page => {
    expect(await getPublicMediaArchive("initiative", parent.slug, page)).toBeNull();
    expect(mocks.initiative).not.toHaveBeenCalled();
  });
  it("rejects unsupported parents without querying media", async () => {
    expect(await getPublicMediaArchive("appeal", parent.slug, 1)).toBeNull();
    expect(mocks.media).not.toHaveBeenCalled();
    expect(mocks.initiative).not.toHaveBeenCalled();
  });
  it("fails closed when all media is withdrawn between reads", async () => {
    mocks.media.mockResolvedValue([]);
    expect(await getPublicMediaArchive("initiative", parent.slug, 1)).toBeNull();
  });
});
