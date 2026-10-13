import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IDENTITY_MEDIA_SORT_ORDER,
  getPublicImageOptimizationUrl,
  canRenderPublicMedia,
  isCspCompatiblePublicImageUrl,
  normalizeSafePublicMediaUrl,
  resolvePublicMediaUrl,
  selectGalleryPublicImage,
  selectIdentityPublicImage,
} from "./public-media";

describe("public media safety", () => {
  afterEach(() => vi.unstubAllEnvs());
  it("never promotes supporting gallery images into an unassigned identity slot", () => {
    expect(selectIdentityPublicImage([
      { kind: "IMAGE", publicUrl: "/media/gallery.jpg", altText: "Eid kits", sortOrder: 0 },
      { kind: "IMAGE", publicUrl: "/media/update.png", altText: "Update", title: "Results update", sortOrder: 1 },
    ])).toBeUndefined();
    expect(selectIdentityPublicImage([])).toBeUndefined();
  });
  it("accepts HTTPS and safe root-relative media URLs", () => {
    expect(resolvePublicMediaUrl({ kind: "IMAGE", publicUrl: "https://cdn.example.org/photo.jpg", altText: "Packing Eid Gift Kits" })).toBe("https://cdn.example.org/photo.jpg");
    expect(resolvePublicMediaUrl({ kind: "DOCUMENT", publicUrl: "/reports/eid-2025.pdf" })).toBe("/reports/eid-2025.pdf");
  });

  it("rejects insecure, executable, credentialed and origin-confusing URLs", () => {
    expect(resolvePublicMediaUrl({ kind: "IMAGE", publicUrl: "http://example.org/photo.jpg", altText: "Photo" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "IMAGE", publicUrl: "//example.org/photo.jpg", altText: "Photo" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "IMAGE", publicUrl: "/\\example.org/photo.jpg", altText: "Photo" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "DOCUMENT", publicUrl: "javascript:alert(1)" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "DOCUMENT", publicUrl: "data:text/html,unsafe" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "DOCUMENT", publicUrl: "https://user:secret@example.org/report.pdf" })).toBeNull();
    expect(resolvePublicMediaUrl({ kind: "DOCUMENT", publicUrl: "https://example.org/report pdf" })).toBeNull();
  });

  it("normalizes accepted URLs through one canonical ingestion/rendering contract", () => {
    expect(normalizeSafePublicMediaUrl("  /media/2026/photo.webp?view=full#evidence  ")).toBe("/media/2026/photo.webp?view=full#evidence");
    expect(normalizeSafePublicMediaUrl("https://cdn.example.org/a%20photo.webp")).toBe("https://cdn.example.org/a%20photo.webp");
    expect(normalizeSafePublicMediaUrl("/media/2026/line\\break.webp")).toBeNull();
  });

  it("requires meaningful alt text before an image can render", () => {
    expect(canRenderPublicMedia({ kind: "IMAGE", publicUrl: "/media/photo.jpg", altText: "" })).toBe(false);
    expect(canRenderPublicMedia({ kind: "IMAGE", publicUrl: "/media/photo.jpg", altText: "Eid Kit packing" })).toBe(true);
  });


  it("renders absolute images only from CSP-compatible configured origins", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.amaana.example/public");

    expect(isCspCompatiblePublicImageUrl("/media/photo.jpg")).toBe(true);
    expect(isCspCompatiblePublicImageUrl("https://amaanafoundation.org/media/photo.jpg")).toBe(true);
    expect(isCspCompatiblePublicImageUrl("https://media.amaana.example/2026/photo.jpg")).toBe(true);
    expect(isCspCompatiblePublicImageUrl("https://unconfigured.example/photo.jpg")).toBe(false);

    expect(canRenderPublicMedia({
      kind: "IMAGE",
      publicUrl: "https://media.amaana.example/2026/photo.jpg",
      altText: "Approved field photograph",
    })).toBe(true);
    expect(canRenderPublicMedia({
      kind: "IMAGE",
      publicUrl: "https://unconfigured.example/photo.jpg",
      altText: "Externally hosted photograph",
    })).toBe(false);
  });

  it("fails closed for hosted video even when descriptive text exists", () => {
    expect(canRenderPublicMedia({ kind: "VIDEO", publicUrl: "https://cdn.example.org/update.mp4" })).toBe(false);
    expect(canRenderPublicMedia({ kind: "VIDEO", publicUrl: "https://cdn.example.org/update.mp4", altText: "Packing video" })).toBe(false);
  });

  it("uses only the external URL for external video records", () => {
    expect(resolvePublicMediaUrl({ kind: "EXTERNAL_VIDEO", externalUrl: "https://www.youtube.com/watch?v=test", publicUrl: "/wrong" })).toBe("https://www.youtube.com/watch?v=test");
    expect(resolvePublicMediaUrl({ kind: "EXTERNAL_VIDEO", externalUrl: "http://example.org/video" })).toBeNull();
  });

  it("selects the explicit identity image before other documentary images", () => {
    const gallery = [
      { kind: "IMAGE" as const, publicUrl: "/media/gallery.webp", altText: "Gallery photograph", sortOrder: 0 },
      { kind: "IMAGE" as const, publicUrl: "/media/hero.webp", altText: "Identity photograph", sortOrder: IDENTITY_MEDIA_SORT_ORDER },
    ];
    expect(selectIdentityPublicImage(gallery)?.publicUrl).toBe("/media/hero.webp");
  });

  it("prefers an approved documentary gallery image for lower-prominence showcase cards", () => {
    const media = [
      { kind: "IMAGE" as const, publicUrl: "/media/identity.webp", altText: "Identity artwork", sortOrder: IDENTITY_MEDIA_SORT_ORDER },
      { kind: "IMAGE" as const, publicUrl: "/media/results.png", altText: "Results graphic", title: "Impact graphic", sortOrder: 1 },
      { kind: "IMAGE" as const, publicUrl: "/media/gallery.webp", altText: "Volunteer packing support kits", title: "Packing day", sortOrder: 2 },
    ];
    expect(selectGalleryPublicImage(media)?.publicUrl).toBe("/media/gallery.webp");
    const identity = media[0];
    if (!identity) throw new Error("Expected identity-media fixture.");
    expect(selectGalleryPublicImage([identity])?.publicUrl).toBe("/media/identity.webp");
  });
});


describe("same-origin public-image optimizer boundary", () => {
  it.each([
    ["/media/2026/photo.webp", "/media/2026/photo.webp"],
    ["/brand/amaana-mark.svg", "/brand/amaana-mark.svg"],
    ["https://amaanafoundation.org/media/2026/photo.webp?version=2", "/media/2026/photo.webp?version=2"],
    ["https://amaanafoundation.org/brand/amaana-mark.svg", "/brand/amaana-mark.svg"],
    ["https://unapproved.example.org/media/photo.webp", null],
    ["https://amaanafoundation.org/admin/documents/private", null],
    ["/api/assistance/private", null],
    ["https://amaanafoundation.org/media/../admin/private", null],
    ["https://user:secret@amaanafoundation.org/media/photo.webp", null],
    ["http://amaanafoundation.org/media/photo.webp", null],
    ["//amaanafoundation.org/media/photo.webp", null],
    ["data:image/svg+xml,synthetic", null],
  ])("normalizes only eligible public image sources: %s", (input, expected) => {
    expect(getPublicImageOptimizationUrl(input, "https://amaanafoundation.org")).toBe(expected);
  });
  it("does not infer an app origin from malformed or missing configuration", () => {
    expect(getPublicImageOptimizationUrl("https://amaanafoundation.org/media/photo.webp", "invalid")).toBeNull();
    expect(getPublicImageOptimizationUrl("https://amaanafoundation.org/media/photo.webp", "")).toBeNull();
    expect(getPublicImageOptimizationUrl("/media/photo.webp", "")).toBe("/media/photo.webp");
  });
});
