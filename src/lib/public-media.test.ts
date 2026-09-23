import { describe, expect, it } from "vitest";
import {
  IDENTITY_MEDIA_SORT_ORDER,
  canRenderPublicMedia,
  normalizeSafePublicMediaUrl,
  resolvePublicMediaUrl,
  selectIdentityPublicImage,
} from "./public-media";

describe("public media safety", () => {
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
});
