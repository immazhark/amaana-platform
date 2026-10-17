import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { faithContent: { findMany: mocks.findMany } } }));
import { getReviewedGivingEducation, CHARITABLE_GIVING_TOPIC_SLUGS } from "./public-charity-education";

const valid = {
  id: "reviewed-1", slug: "reviewed-charity-reflection",
  title: "A reviewed reflection", excerpt: "Sourced, carefully edited context.",
  type: "ARTICLE", status: "PUBLISHED", religiousReviewStatus: "VERIFIED",
  verifiedAt: new Date("2026-09-01T12:00:00Z"), sourceCitation: "Documented reference",
  topics: [{ topic: { slug: "sadaqah", name: "Sadaqah" } }],
};

describe("public charitable-giving education", () => {
  beforeEach(() => { vi.resetAllMocks(); mocks.findMany.mockResolvedValue([]); });
  it("uses the existing verified and cited publication gate plus a bounded query", async () => {
    await getReviewedGivingEducation();
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        status: "PUBLISHED", religiousReviewStatus: "VERIFIED",
        verifiedAt: { not: null }, sourceCitation: { not: null },
        topics: { some: { topic: { slug: { in: [...CHARITABLE_GIVING_TOPIC_SLUGS] } } } },
      },
      take: 12,
    }));
  });
  it("excludes drafts, unreviewed sources, invalid slugs and unrelated topics", async () => {
    mocks.findMany.mockResolvedValueOnce([
      valid,
      { ...valid, id: "draft", status: "DRAFT" },
      { ...valid, id: "unreviewed", religiousReviewStatus: "NEEDS_REVIEW" },
      { ...valid, id: "blank-citation", sourceCitation: " " },
      { ...valid, id: "unsafe-link", slug: "../admin" },
      { ...valid, id: "wrong-topic", topics: [{ topic: { slug: "random", name: "Random" } }] },
    ]);
    expect((await getReviewedGivingEducation()).map(item => item.id)).toEqual(["reviewed-1"]);
  });
  it("returns an empty collection instead of inventing reviewed articles", async () => {
    expect(await getReviewedGivingEducation()).toEqual([]);
  });
});
