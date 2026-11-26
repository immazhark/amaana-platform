import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";
vi.mock("server-only", () => ({}));

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

function request(search = "") {
  return new Request(`https://amaanafoundation.org/media/${year}/${filename}${search}`);
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

  it("serves approved media without shared caching so every new request rechecks approval", async () => {
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
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("cache-control")).not.toMatch(/immutable/i);
    expect(response.headers.get("etag")).toBe('"abc123"');
    expect(await response.arrayBuffer()).toEqual(new Uint8Array([82, 73, 70, 70]).buffer);
    expect(mocks.getPublicMediaObject).toHaveBeenCalledWith(objectKey);
  });

  it("rechecks the same key after withdrawal rather than reading its stored bytes", async () => {
    mocks.findFirst.mockResolvedValueOnce(approvedAsset()).mockResolvedValueOnce(null);
    mocks.getPublicMediaObject.mockResolvedValue({
      bytes: new Uint8Array([82, 73, 70, 70]), contentType: "image/webp", etag: null, lastModified: null,
    });
    const before = await GET(request(), context());
    expect(before.status).toBe(200);
    expect(before.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    const after = await GET(request(), context());
    expect(after.status).toBe(404);
    expect(after.headers.get("cache-control")).toBe("no-store");
    expect(await after.text()).toBe("");
    expect(mocks.findFirst).toHaveBeenCalledTimes(2);
    expect(mocks.getPublicMediaObject).toHaveBeenCalledTimes(1);
  });

  it("serves a bounded metadata-free rendition and refuses it after withdrawal", async () => {
    const original = await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#466faa" } }).webp().withMetadata().toBuffer();
    mocks.findFirst.mockResolvedValueOnce(approvedAsset()).mockResolvedValueOnce(null);
    mocks.getPublicMediaObject.mockResolvedValue({ bytes: original, contentType: "image/webp", etag: '"original"', lastModified: new Date() });
    const response = await GET(request("?w=640"), context());
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("etag")).toBeNull();
    expect(response.headers.get("last-modified")).toBeNull();
    const bytes = Buffer.from(await response.arrayBuffer());
    expect(Number(response.headers.get("content-length"))).toBe(bytes.length);
    expect(await sharp(bytes).metadata()).toMatchObject({ format: "webp", width: 640, height: 400 });
    expect((await sharp(bytes).metadata()).exif).toBeUndefined();
    const revoked = await GET(request("?w=640"), context());
    expect(revoked.status).toBe(404);
    expect(revoked.headers.get("cache-control")).toBe("no-store");
    expect(await revoked.text()).toBe("");
    expect(mocks.getPublicMediaObject).toHaveBeenCalledTimes(1);
  });

  it("refuses invalid rendition parameters and PDF variants before looking up records", async () => {
    for (const search of ["?w=641", "?w=640&w=384", "?w=640&quality=100"]) {
      expect((await GET(request(search), context())).status).toBe(404);
    }
    const pdf = filename.replace(".webp", ".pdf");
    expect((await GET(new Request(`https://amaanafoundation.org/media/${year}/${pdf}?w=640`), context({ filename: pdf }))).status).toBe(404);
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.getPublicMediaObject).not.toHaveBeenCalled();
  });

  it("never falls back to original bytes when a rendition cannot be decoded", async () => {
    mocks.findFirst.mockResolvedValue(approvedAsset());
    mocks.getPublicMediaObject.mockResolvedValue({ bytes: Buffer.from("synthetic invalid raster"), contentType: "image/webp" });
    const response = await GET(request("?w=640"), context());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.text()).toBe("");
  });

  it("serves an approved managed PDF through the same gated proxy", async () => {
    const pdfFilename = "123e4567-e89b-12d3-a456-426614174000.pdf";
    const pdfKey = `${year}/${pdfFilename}`;
    mocks.findFirst.mockResolvedValue({
      kind: "DOCUMENT",
      publicUrl: `https://amaanafoundation.org/media/${pdfKey}`,
      externalUrl: null,
      altText: null,
    });
    mocks.getPublicMediaObject.mockResolvedValue({
      bytes: new Uint8Array([37, 80, 68, 70, 45]),
      contentType: "application/pdf",
      etag: null,
      lastModified: null,
    });

    const response = await GET(
      new Request(`https://amaanafoundation.org/media/${pdfKey}`),
      context({ filename: pdfFilename }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("cache-control")).toBe("private, no-store, max-age=0");
    expect(response.headers.get("content-disposition")).toBe("inline");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(mocks.getPublicMediaObject).toHaveBeenCalledWith(pdfKey);
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

  it("returns a retryable non-cacheable response when the publication lookup fails", async () => {
    mocks.findFirst.mockRejectedValue(new Error("synthetic private database diagnostic"));
    const response = await GET(request(), context());
    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("retry-after")).toBe("60");
    expect(response.headers.get("x-robots-tag")).toBe("noindex, nofollow, noarchive");
    expect(await response.text()).toBe("");
    expect(mocks.getPublicMediaObject).not.toHaveBeenCalled();
  });

});
