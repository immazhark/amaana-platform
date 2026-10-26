import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({ permission: vi.fn(), allowed: vi.fn(), assets: vi.fn(), empty: vi.fn(), count: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requirePermission: mocks.permission, hasPermission: mocks.allowed }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  mediaAsset: { count: mocks.count, groupBy: mocks.empty, findMany: mocks.assets },
  cause: { findMany: mocks.empty }, initiative: { findMany: mocks.empty },
  story: { findMany: mocks.empty }, faithContent: { findMany: mocks.empty }, auditEvent: { findMany: mocks.empty },
} }));
vi.mock("@/lib/storage", () => ({ getPublicMediaStorageReadiness: () => ({ uploadReady: false }) }));
vi.mock("@/components/curated-gallery-importer", () => ({ CuratedGalleryImporter: () => null }));
vi.mock("./actions", () => ({ createMediaAsset: vi.fn(), deleteMediaAsset: vi.fn(), setMediaPublication: vi.fn(), updateMediaAsset: vi.fn() }));
import AdminMediaPage from "./page";

const metadata = ["title", "sourceYear", "publicUrl", "altText", "caption", "sourcePath", "sortOrder"];
const review = ["privacyClass", "consentStatus", "reviewNotes", "confirm"];
const assets = ["synthetic-one", "synthetic-two"].map(id => ({ id, kind: "IMAGE", isPublic: false, updatedAt: new Date("2026-10-26T00:00:00Z") }));
beforeEach(() => {
  vi.resetAllMocks();
  mocks.permission.mockResolvedValue({}); mocks.allowed.mockReturnValue(true);
  mocks.empty.mockResolvedValue([]); mocks.count.mockResolvedValue(2); mocks.assets.mockResolvedValue(assets);
});

describe("media card accessible labels", () => {
  it.each([false, true])("associates each visible control for public=%s without duplicate page IDs", async isPublic => {
    mocks.assets.mockResolvedValue(assets.map(asset => ({ ...asset, isPublic })));
    const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({}) }));
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    const cards = [...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)];
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      for (const field of [...metadata, ...(isPublic ? [] : review)]) {
        const control = [...card[1]!.matchAll(/<(?:input|select|textarea)\b([^>]*)>/g)]
          .find(match => new RegExp(`\\bname="${field}"`).test(match[1]!));
        const id = control?.[1]?.match(/\bid="([^"]+)"/)?.[1];
        expect(id, `Missing id: ${field}`).toBeTruthy();
        const label = [...card[1]!.matchAll(/<label\b([^>]*)>([\s\S]*?)<\/label>/g)]
          .find(match => match[1]!.includes(`for="${id}"`));
        expect(label?.[2]?.trim(), `Missing visible label: ${field}`).toBeTruthy();
      }
    }
    expect(mocks.permission).toHaveBeenCalledWith("content.view");
  });

  it("keeps modification forms absent for view-only users", async () => {
    mocks.allowed.mockReturnValue(false);
    const html = renderToStaticMarkup(await AdminMediaPage({ searchParams: Promise.resolve({}) }));
    expect(html).not.toContain("<form");
  });
});
