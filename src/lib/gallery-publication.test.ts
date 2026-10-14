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
  it("rejects empty descriptions and identifiers rather than producing unnamed lightbox controls", () => {
    expect(selectSafeGalleryImages([{ ...approved, alt: null }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, alt: " " }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, id: " " }])).toEqual([]);
  });

  it("rejects absolute same-origin links to private application routes", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const privateSameOrigin = "https://amaanafoundation.org/api/admin/private-evidence";
    expect(selectSafeGalleryImages([{ ...approved, url: privateSameOrigin }])).toEqual([]);
    expect(selectSafeGalleryImages([{ ...approved, url: "https://amaanafoundation.org/media/approved.webp" }])).toHaveLength(1);
  });
  it("retains HTTPS media delivery from a separately approved public CDN", () => {
    expect(selectSafeGalleryImages([{ ...approved, url: "https://cdn.example.org/approved.webp" }])[0]?.url)
      .toBe("https://cdn.example.org/approved.webp");
  });
});
