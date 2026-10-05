import { describe, expect, it } from "vitest";
import {
  COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION,
  PROGRAMME_CHILD_MEDIA_PROJECTION,
  PUBLIC_APPROVED_IMAGE_WHERE,
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

  it("loads a bounded approved gallery set for completed-support showcase cards", () => {
    expect(COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION.where).toBe(PUBLIC_APPROVED_IMAGE_WHERE);
    expect(COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION.where).not.toHaveProperty("sortOrder");
    expect(COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION.take).toBe(12);
    expect(COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION.orderBy).toEqual([
      { sourceYear: "desc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ]);
    expect(COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION.select).toBe(PUBLIC_IMAGE_SELECT);
  });

  it("loads bounded approved gallery candidates for programme-hub thumbnails", () => {
    expect(PROGRAMME_CHILD_MEDIA_PROJECTION.where).toBe(PUBLIC_APPROVED_IMAGE_WHERE);
    expect(PROGRAMME_CHILD_MEDIA_PROJECTION.where).not.toHaveProperty("sortOrder");
    expect(PROGRAMME_CHILD_MEDIA_PROJECTION.take).toBe(12);
    expect(PROGRAMME_CHILD_MEDIA_PROJECTION.orderBy).toEqual([
      { sourceYear: "desc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ]);
    expect(PROGRAMME_CHILD_MEDIA_PROJECTION.select).toBe(PUBLIC_IMAGE_SELECT);
  });
});
