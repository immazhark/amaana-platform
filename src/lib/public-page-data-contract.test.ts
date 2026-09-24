import { describe, expect, it } from "vitest";
import {
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
});
