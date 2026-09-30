import { describe, expect, it } from "vitest";
import { IDENTITY_MEDIA_SORT_ORDER } from "@/lib/public-media";
import {
  PUBLIC_APPROVED_IMAGE_WHERE,
  PUBLIC_IDENTITY_IMAGE_WHERE,
} from "@/lib/public-page-data";

describe("public discovery media boundary", () => {
  it("keeps gallery approval separate from identity/thumbnail approval", () => {
    expect(PUBLIC_APPROVED_IMAGE_WHERE).not.toHaveProperty("sortOrder");
    expect(PUBLIC_IDENTITY_IMAGE_WHERE).toMatchObject({
      kind: "IMAGE",
      isPublic: true,
      sortOrder: IDENTITY_MEDIA_SORT_ORDER,
    });
    expect(PUBLIC_IDENTITY_IMAGE_WHERE.privacyApprovedAt).toEqual({ not: null });
  });
});
