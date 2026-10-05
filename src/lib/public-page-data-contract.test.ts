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

  it("loads bounded approved gallery candidates for lower-prominence programme cards", () => {
    for (const projection of [
      COMPLETED_AID_SHOWCASE_MEDIA_PROJECTION,
      PROGRAMME_CHILD_MEDIA_PROJECTION,
    ]) {
      expect(projection.where).toBe(PUBLIC_APPROVED_IMAGE_WHERE);
      expect(projection.where).not.toHaveProperty("sortOrder");
      expect(projection.take).toBe(12);
      expect(projection.orderBy).toEqual([
        { sortOrder: "asc" },
        { sourceYear: "desc" },
        { createdAt: "desc" },
      ]);
      expect(projection.select).toBe(PUBLIC_IMAGE_SELECT);
    }
  });
});
