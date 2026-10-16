import { afterEach, describe, expect, it, vi } from "vitest";
import { selectSafeGalleryImages } from "./gallery-publication";

describe("public-safe gallery presentation boundary", () => {
  afterEach(() => vi.unstubAllEnvs());
  const approved = { id: "photo1", url: "/media/2026/photo.webp", alt: "Volunteers packing food kits", caption: "Packing day" };

  it("preserves an approved photograph, caption and valid normalized address", () => {
    expect(selectSafeGalleryImages([approved])).toEqual([approved]);
    expect(selectSafeGalleryImages([{ ...approved, url: " /media/2026/photo.webp?revision=2 " }])[0]?.url)
      .toBe("/media/2026/photo.webp?revision=2");
  });

  it("deduplicates stable identities and normalized URLs before rendering", () => {
    expect(selectSafeGalleryImages([
      approved,
      { ...approved, id: "duplicate-url", url: " /media/2026/photo.webp " },
      { ...approved, url: "/media/another.webp" },
      { ...approved, id: "photo2", url: "/media/another.webp" },
    ])).toHaveLength(2);
  });

  it.each([
    "javascript:alert(1)", "data:image/svg+xml,unsafe", "http://example.com/x.jpg",
    "//cdn.example.org/x.jpg", "/\\evil.example/a.jpg", "/admin/media/private.jpg",
    "/api/assistance/private", "/donations/private-receipt.jpg",
    "/request-assistance/status", "/_next/image?url=%2Fadmin%2Fsecret",
  ])("rejects malformed and private image destinations: %s", url => {
    expect(selectSafeGalleryImages([{ ...approved, url }])).toEqual([]);
  });

  it("fails closed when runtime data disagrees with the static gallery image type", () => {
    const malformed = { ...approved, url: 21 } as unknown as typeof approved;
    expect(selectSafeGalleryImages([malformed])).toEqual([]);
  });
  it("does not allow malformed caption objects or oversized editorial fields into gallery rendering", () => {
    const valid = selectSafeGalleryImages([approved]);
    expect(valid).toHaveLength(1);
    const invalid = [
      { ...approved, caption: { hidden: "untrusted-object" } },
      { ...approved, id: "x".repeat(129) },
      { ...approved, alt: "a".repeat(301) },
      { ...approved, caption: "x".repeat(1001) },
      { ...approved, caption: "unsafe\\u0000caption".replace("\\u0000", "\u0000") },
    ] as unknown as typeof approved[];
    expect(selectSafeGalleryImages(invalid)).toEqual([]);
    expect(selectSafeGalleryImages(null as unknown as typeof approved[])).toEqual([]);
  });
  it("rejects empty descriptions and identifiers rather than producing unnamed lightbox controls", () => {
    expect(selectSafeGalleryImages([{ ...approved, alt: null }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, alt: " " }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, id: " " }])).toEqual([]);
  });

  it("rejects an encoded private image even when the manifest marks it as published", () => {
    for (const url of ["/%61dmin/private.webp", "/%2561dmin/private.webp", "/media/%252e%252e/admin/private.webp"]) {
      expect(selectSafeGalleryImages([{ ...approved, url }])).toEqual([]);
    }
  });

  it("rejects absolute same-origin links to private application routes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const privateSameOrigin = "https://amaanafoundation.org/api/admin/private-evidence";
    expect(selectSafeGalleryImages([{ ...approved, url: privateSameOrigin }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, url: "https://amaanafoundation.org/media/approved.webp" }])).toHaveLength(1);
  });
  it("retains image delivery only from a separately configured HTTPS public CDN", () => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://cdn.example.org/public");
    expect(selectSafeGalleryImages([{ ...approved, url: "https://cdn.example.org/approved.webp" }])[0]?.url)
      .toBe("https://cdn.example.org/approved.webp");
  });

  it("honors the exact server-serialized image host after client hydration", () => {
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "");
    const url = "https://approved.example.org/2026/photo.webp";
    expect(selectSafeGalleryImages([{ ...approved, url }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, url }], ["https://approved.example.org"])[0]?.url).toBe(url);
    expect(selectSafeGalleryImages([{ ...approved, url: "https://approved.example.org.evil.test/photo.webp" }], ["https://approved.example.org"])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, url: "https://approved.example.org/admin/private.webp" }], ["https://approved.example.org"])).toHaveLength(1);
  });

  it("rejects unknown HTTPS image hosts even when a gallery record looks approved", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.amaana.example");
    for (const url of [
      "https://unapproved.example/photo.webp",
      "https://media.amaana.example.evil.test/photo.webp",
      "https://www.amaanafoundation.org/admin/private.webp",
      "https://amaanafoundation.org./api/private.webp",
    ]) {
      expect(selectSafeGalleryImages([{ ...approved, url }]), url).toEqual([]);
    }
    expect(selectSafeGalleryImages([{ ...approved, url: "https://media.amaana.example/photo.webp" }])).toHaveLength(1);
  });
});
