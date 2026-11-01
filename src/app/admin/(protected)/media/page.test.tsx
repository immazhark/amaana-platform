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
    expect(html).toContain(`No ${label} media records match this filter.`);
    expect(html).toContain('href="/admin/media">Clear filter</a>');
    expect(html).not.toContain("No media records yet.");
  });

  it("keeps the original truthful empty state for the unfiltered library", async () => {
    mocks.groups.mockResolvedValue([]);
    const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({}) }));
    expect(mocks.count).toHaveBeenCalledWith({ where: undefined });
    expect(html).toContain("No media records yet.");
    expect(html).not.toContain("Clear filter");
  });
});
