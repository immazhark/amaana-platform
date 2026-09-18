import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  getPublicMediaObject: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    mediaAsset: {
      findFirst: mocks.findFirst,
    },
  },
}));

vi.mock("@/lib/public-media", () => ({
  canRenderPublicMedia: (asset: { kind: string; publicUrl?: string | null; altText?: string | null }) =>
    asset.kind !== "VIDEO" && Boolean(asset.publicUrl?.startsWith("https://") && (asset.kind !== "IMAGE" || asset.altText?.trim())),
}));

vi.mock("@/lib/storage", () => ({
  isManagedPublicMediaKey: (value: string) => /^\d{4}\/[0-9a-f-]{36}\.(?:pdf|jpg|png|webp)$/i.test(value),
  getPublicMediaObject: mocks.getPublicMediaObject,
}));

import { GET } from "./route";

const year = "2026";
const filename = "123e4567-e89b-12d3-a456-426614174000.webp";
const objectKey = `${year}/${filename}`;

function request() {
  return new Request(`https://amaanafoundation.org/media/${year}/${filename}`);
}

function context(overrides?: Partial<{ year: string; filename: string }>) {
  return { params: Promise.resolve({ year, filename, ...overrides }) };
}

function approvedAsset() {
  return {
    kind: "IMAGE" as const,
    publicUrl: `https://amaanafoundation.org/media/${objectKey}`,
    externalUrl: null,
    altText: "Amaana programme distribution supplies prepared for delivery",
  };
}

describe("approved public media delivery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unmanaged keys before database or storage access", async () => {
    const response = await GET(request(), context({ filename: "../../private.pdf" }));

    expect(response.status).toBe(404);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.getPublicMediaObject).not.toHaveBeenCalled();
  });

  it("does not expose uploaded media until the publication and privacy gates are active", async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await GET(request(), context());

    expect(response.status).toBe(404);
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        storageKey: objectKey,
        isPublic: true,
        privacyApprovedAt: { not: null },
      },
    }));
    expect(mocks.getPublicMediaObject).not.toHaveBeenCalled();
  });

  it("serves approved media with bounded caching so later unpublication can revoke access", async () => {
    mocks.findFirst.mockResolvedValue(approvedAsset());
    mocks.getPublicMediaObject.mockResolvedValue({
      bytes: new Uint8Array([82, 73, 70, 70]),
      contentType: "image/webp",
      etag: '"abc123"',
      lastModified: new Date("2026-09-17T12:00:00Z"),
    });

    const response = await GET(request(), context());

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("content-length")).toBe("4");
    expect(response.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=300, must-revalidate");
    expect(response.headers.get("cache-control")).not.toMatch(/immutable/i);
    expect(response.headers.get("etag")).toBe('"abc123"');
    expect(await response.arrayBuffer()).toEqual(new Uint8Array([82, 73, 70, 70]).buffer);
    expect(mocks.getPublicMediaObject).toHaveBeenCalledWith(objectKey);
  });

  it("fails closed when the stored object content type disagrees with its managed extension", async () => {
    mocks.findFirst.mockResolvedValue(approvedAsset());
    mocks.getPublicMediaObject.mockResolvedValue({
      bytes: new Uint8Array([37, 80, 68, 70]),
      contentType: "application/pdf",
      etag: null,
      lastModified: null,
    });

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
  });

  it("fails closed when the private bucket read is unavailable", async () => {
    mocks.findFirst.mockResolvedValue(approvedAsset());
    mocks.getPublicMediaObject.mockRejectedValue(new Error("storage unavailable"));

    const response = await GET(request(), context());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
  });
});
