import { describe, expect, it } from "vitest";
import { isPublicFaithReviewComplete } from "./faith-publication";

describe("faith publication review gate", () => {
  const verifiedAt = new Date("2026-09-16T00:00:00Z");

  it("allows only published, verified and cited faith content", () => {
    expect(isPublicFaithReviewComplete({
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
      verifiedAt,
      sourceCitation: "Surah Al-Baqarah 2:267 · The Clear Quran",
    })).toBe(true);
  });

  it("fails closed when the review timestamp or citation is missing", () => {
    expect(isPublicFaithReviewComplete({
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
      verifiedAt: null,
      sourceCitation: "Sahih Muslim 2588",
    })).toBe(false);

    expect(isPublicFaithReviewComplete({
      status: "PUBLISHED",
      religiousReviewStatus: "VERIFIED",
      verifiedAt,
      sourceCitation: "   ",
    })).toBe(false);
  });

  it("rejects drafts or unverified religious review states", () => {
    expect(isPublicFaithReviewComplete({
      status: "DRAFT",
      religiousReviewStatus: "VERIFIED",
      verifiedAt,
      sourceCitation: "Sahih Muslim 2588",
    })).toBe(false);

    expect(isPublicFaithReviewComplete({
      status: "PUBLISHED",
      religiousReviewStatus: "NEEDS_REVIEW",
      verifiedAt,
      sourceCitation: "Sahih Muslim 2588",
    })).toBe(false);
  });
});
