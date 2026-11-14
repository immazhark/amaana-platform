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

it("rejects invalid review Date instances without rejecting a valid zero epoch", () => {
 const record={status:"PUBLISHED",religiousReviewStatus:"VERIFIED",sourceCitation:"Reviewed source"};
 expect(isPublicFaithReviewComplete({...record,verifiedAt:new Date(NaN)})).toBe(false);
 expect(isPublicFaithReviewComplete({...record,verifiedAt:new Date(0)})).toBe(true);
});

it("fails closed for malformed runtime Faith records and citations", () => {
  const approved = {
    status: "PUBLISHED", religiousReviewStatus: "VERIFIED",
    verifiedAt: new Date("2026-11-14T00:00:00Z"),
    sourceCitation: "Reviewed source",
  };
  const malformed = [
    null, undefined, [],
    { ...approved, sourceCitation: { private: "PRIVATE_CITATION" } },
    { ...approved, sourceCitation: ["PRIVATE_CITATION"] },
    { ...approved, sourceCitation: 42 },
  ] as unknown as Array<Parameters<typeof isPublicFaithReviewComplete>[0]>;
  for (const candidate of malformed) {
    expect(isPublicFaithReviewComplete(candidate)).toBe(false);
  }
  expect(isPublicFaithReviewComplete(approved)).toBe(true);
  expect(isPublicFaithReviewComplete({ ...approved, sourceCitation: "  " })).toBe(false);
  expect(isPublicFaithReviewComplete({ ...approved, religiousReviewStatus: "PENDING" })).toBe(false);
});
