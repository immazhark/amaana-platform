import { afterEach, describe, expect, it, vi } from "vitest";
import {
  IDENTITY_MEDIA_SORT_ORDER,
  getPublicImageOptimizationUrl,
  canRenderPublicMedia,
  isCspCompatiblePublicImageUrl,
  isPrivateAppMediaUrl,
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

  it("never displays publicly published records pointing into private app paths", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const privateUrls = [
      "/api/admin/financial-evidence",
      "/admin/evidence",
      "/donations/AF-PRIVATE/acknowledgement",
      "/request-assistance/status",
      "/request-assistance/received",
      "/_next/image?url=%2Fadmin%2Fprivate",
      "https://amaanafoundation.org/admin/private.jpg",
      "https://amaanafoundation.org/api/private.pdf",
    ];
    for (const url of privateUrls) {
      expect(isPrivateAppMediaUrl(url), url).toBe(true);
      expect(canRenderPublicMedia({ kind: "IMAGE", publicUrl: url, altText: "Approved test photograph" })).toBe(false);
      expect(canRenderPublicMedia({ kind: "DOCUMENT", publicUrl: url, title: "Private file" })).toBe(false);
    }
    expect(isPrivateAppMediaUrl("/media/2026/approved.webp")).toBe(false);
    expect(canRenderPublicMedia({
      kind: "DOCUMENT", publicUrl: "/reports/approved.pdf", title: "Published report",
    })).toBe(true);
  });

  it("rejects encoded or double-encoded paths to private resources", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    const paths = [
      "/%61dmin/records/private.pdf",
      "/%2561dmin/records/private.pdf",
      "/%252561dmin/records/private.pdf",
      "/%61pi/admin/private",
      "/%64onations/receipt/private",
      "/%5Fnext/image?url=%2Fadmin%2Fsecret",
      "/media/%252e%252e/admin/private.webp",
      "/media/%2fadmin/private.webp",
      "https://amaanafoundation.org/%61dmin/records/private.webp",
    ];
    for (const url of paths) {
      expect(isPrivateAppMediaUrl(url), url).toBe(true);
      expect(canRenderPublicMedia({ kind: "IMAGE", publicUrl: url, altText: "Reviewed source" }), url).toBe(false);
      expect(canRenderPublicMedia({ kind: "DOCUMENT", publicUrl: url, title: "Private record" }), url).toBe(false);
      expect(getPublicImageOptimizationUrl(url), url).toBeNull();
    }
  });

  it("keeps legitimate percent-encoded reviewed filenames visible", () => {
    expect(isPrivateAppMediaUrl("/media/2026/Eid%20Gift%20Kits.webp")).toBe(false);
    expect(isPrivateAppMediaUrl("/media/2026/photo%23draft.webp")).toBe(true);
    expect(getPublicImageOptimizationUrl("/media/2026/Eid%20Gift%20Kits.webp"))
      .toBe("/media/2026/Eid%20Gift%20Kits.webp");
    expect(canRenderPublicMedia({
      kind: "IMAGE", publicUrl: "/media/2026/Eid%20Gift%20Kits.webp", altText: "Approved volunteer packing photo",
    })).toBe(true);
  });

  it("does not mistake a separately approved HTTPS media host for an app route", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://amaanafoundation.org");
    vi.stubEnv("PUBLIC_MEDIA_BASE_URL", "https://media.amaana.example");
    expect(isPrivateAppMediaUrl("https://media.amaana.example/admin/cover.webp")).toBe(false);
    expect(canRenderPublicMedia({
      kind: "IMAGE",
      publicUrl: "https://media.amaana.example/admin/cover.webp",
      altText: "Externally approved source",
    })).toBe(true);
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
