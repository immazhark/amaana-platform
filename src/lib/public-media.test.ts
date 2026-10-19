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

  it("rejects private app routes in public image and document media", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    for (const url of [
      "/admin/financial-evidence",
      "/api/admin/private",
      "/donations/AF-PRIVATE/acknowledgement",
      "/request-assistance/status",
      "/_next/image?url=%2Fadmin%2Fprivate",
      "/%61dmin/private",
      "/%2561dmin/private",
      "/media/%252e%252e/admin/record.webp",
      "https://www.amaanafoundation.org/api/private.pdf",
      "https://amaanafoundation.org./admin/private.jpg",
    ]) {
      expect(canRenderPublicMedia({ kind: "IMAGE", publicUrl: url, altText: "Test asset" }), url).toBe(false);
      expect(canRenderPublicMedia({ kind: "DOCUMENT", publicUrl: url, title: "Test asset" }), url).toBe(false);
    }
  });

  it("preserves approved public documents and encoded media filenames", () => {
    expect(canRenderPublicMedia({
      kind: "IMAGE", publicUrl: "/media/2026/Eid%20Gift%20Kits.webp", altText: "Packing kits",
    })).toBe(true);
    expect(canRenderPublicMedia({
      kind: "DOCUMENT", publicUrl: "/reports/approved.pdf", title: "Impact report",
    })).toBe(true);
    expect(canRenderPublicMedia({
      kind: "EXTERNAL_VIDEO", externalUrl: "https://www.youtube.com/watch?v=approved",
    })).toBe(true);
  });

  it("optimizes only public managed image paths on the configured application origin", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    expect(getPublicImageOptimizationUrl("/media/2026/Eid%20Kits.webp"))
      .toBe("/media/2026/Eid%20Kits.webp");
    expect(getPublicImageOptimizationUrl("https://amaanafoundation.org/media/approved.webp?width=small"))
      .toBe("/media/approved.webp?width=small");
    expect(getPublicImageOptimizationUrl("https://amaanafoundation.org/brand/mark.svg"))
      .toBe("/brand/mark.svg");

    // Remote CDN images remain direct until their hosts are configured for Next optimization.
    expect(getPublicImageOptimizationUrl("https://cdn.example.org/media/approved.webp")).toBeNull();
    expect(getPublicImageOptimizationUrl("https://www.amaanafoundation.org/media/approved.webp")).toBeNull();
  });

  it("never optimizes private, recursively encoded or untrusted managed-looking paths", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    for (const url of [
      "/api/admin/evidence.png",
      "/_next/image?url=%2Fadmin%2Fprivate",
      "/media/%252e%252e/admin/private.webp",
      "https://amaanafoundation.org/media/%252e%252e/admin/private.webp",
      "https://amaanafoundation.org/api/private.jpg",
      "https://attacker.example.org/media/photo.jpg",
    ]) {
      expect(getPublicImageOptimizationUrl(url), url).toBeNull();
    }
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
