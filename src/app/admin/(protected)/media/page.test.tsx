import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  permission: vi.fn(),
  count: vi.fn(),
  groups: vi.fn(),
  assets: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  requirePermission: mocks.permission,
  hasPermission: () => false,
}));
vi.mock("@/lib/prisma", () => ({ prisma: {
  mediaAsset: { count: mocks.count, groupBy: mocks.groups, findMany: mocks.assets },
  cause: { findMany: () => [] },
  initiative: { findMany: () => [] },
  story: { findMany: () => [] },
  faithContent: { findMany: () => [] },
  auditEvent: { findMany: () => [] },
} }));
vi.mock("@/lib/storage", () => ({
  getPublicMediaStorageReadiness: () => ({
    separateBucketConfigured: false,
    uploadReady: false,
    deliveryReady: false,
    usingFallbackCredentials: false,
    baseUrlConfigured: false,
    baseUrlSecure: false,
  }),
}));
vi.mock("@/components/curated-gallery-importer", () => ({ CuratedGalleryImporter: () => null }));
vi.mock("./actions", () => ({
  createMediaAsset: vi.fn(),
  deleteMediaAsset: vi.fn(),
  setMediaPublication: vi.fn(),
  updateMediaAsset: vi.fn(),
}));

import AdminMediaPage from "./page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({});
  mocks.count.mockResolvedValue(0);
  mocks.assets.mockResolvedValue([]);
});

describe("Media Library empty filter feedback", () => {
  it.each([
    { visibility: "public", opposite: false, label: "public" },
    { visibility: "review", opposite: true, label: "private review" },
  ])("explains an empty $visibility filter without claiming the whole library is empty", async ({ visibility, opposite, label }) => {
    mocks.groups.mockResolvedValue([{ isPublic: opposite, _count: { _all: 2 } }]);
    const html = renderToStaticMarkup(await AdminMediaPage({
      searchParams: Promise.resolve({ visibility }),
    }));
    expect(mocks.count).toHaveBeenCalledWith({ where: { isPublic: visibility === "public" } });
    expect(html).toContain(visibility === "review" ? "No images awaiting review." : `No ${label} media records match this filter.`);
    expect(html).toContain('href="/admin/media?visibility=all">Clear filter</a>');
    expect(html).not.toContain("No media records yet.");
  });

  it("keeps a truthful empty state for the explicit all-media archive", async () => {
    mocks.groups.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({ visibility: "all" }) }));
    expect(mocks.count).toHaveBeenCalledWith({ where: undefined });
    expect(html).toContain("No media records yet.");
    expect(html).not.toContain("Clear filter");
  });
});

describe("Media Library minimum displayed and editable asset projection", () => {
  it("fetches only review-list and editor fields with relation titles", async () => {
    mocks.count.mockResolvedValue(1);
    mocks.groups.mockResolvedValue([{ isPublic: false, _count: { _all: 1 } }]);
    mocks.assets.mockResolvedValue([{
      id: "synthetic-media",
      isPublic: false,
      kind: "IMAGE",
      sortOrder: 0,
      sourceYear: 2026,
      title: "Synthetic media review",
      altText: "Synthetic image",
      sourcePath: "synthetic-input",
      publicUrl: null,
      updatedAt: new Date("2026-11-10T00:00:00Z"),
      caption: null,
      cause: null,
      initiative: { title: "Synthetic initiative" },
      story: null,
      faithContent: null,
    }]);

    const html = renderToStaticMarkup(await AdminMediaPage({
      searchParams: Promise.resolve({ visibility: "review" }),
    }));

    expect(mocks.permission).toHaveBeenCalledWith("content.view");
    expect(mocks.assets).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({
      where: { isPublic: false },
      select: {
        id: true,
        isPublic: true,
        kind: true,
        sortOrder: true,
        sourceYear: true,
        title: true,
        altText: true,
        sourcePath: true,
        publicUrl: true,
        updatedAt: true,
        caption: true,
        cause: { select: { title: true } },
        initiative: { select: { title: true } },
        story: { select: { title: true } },
        faithContent: { select: { title: true } },
      },
      orderBy: [
        { isPublic: "asc" },
        { sourceYear: "desc" },
        { sortOrder: "asc" },
        { createdAt: "desc" },
        { id: "desc" },
      ],
    }));
    expect(html).toContain("Synthetic media review");
    expect(html).toContain("Synthetic initiative");
    expect(html).toContain("PRIVATE REVIEW");
  });
});
