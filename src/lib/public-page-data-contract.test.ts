import { describe, expect, it } from "vitest";
import {
  PUBLIC_APPROVED_IMAGE_WHERE,
  PUBLIC_GALLERY_MEDIA_PROJECTION,
  PUBLIC_IMAGE_SELECT,
} from "./public-page-data";

describe("public page media projection contract", () => {
  it("preserves publication/privacy gates and identity metadata in lean image projections", () => {
    expect(PUBLIC_APPROVED_IMAGE_WHERE).toEqual({
      kind: "IMAGE",
      isPublic: true,
      privacyApprovedAt: { not: null },
      publicUrl: { not: null },
      altText: { not: "" },
    });
    expect(PUBLIC_IMAGE_SELECT.sortOrder).toBe(true);
    expect(PUBLIC_IMAGE_SELECT.altText).toBe(true);
    expect(PUBLIC_IMAGE_SELECT.width).toBe(true);
    expect(PUBLIC_IMAGE_SELECT.height).toBe(true);
  });

  it("loads a bounded approved gallery set for lower-prominence public cards", () => {
    expect(PUBLIC_GALLERY_MEDIA_PROJECTION.where).toBe(PUBLIC_APPROVED_IMAGE_WHERE);
    expect(PUBLIC_GALLERY_MEDIA_PROJECTION.where).not.toHaveProperty("sortOrder");
    expect(PUBLIC_GALLERY_MEDIA_PROJECTION.take).toBe(12);
    expect(PUBLIC_GALLERY_MEDIA_PROJECTION.orderBy).toEqual([
      { sortOrder: "asc" },
      { sourceYear: "desc" },
      { createdAt: "desc" },
    ]);
    expect(PUBLIC_GALLERY_MEDIA_PROJECTION.select).toBe(PUBLIC_IMAGE_SELECT);
  });
});
