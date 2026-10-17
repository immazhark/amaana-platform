import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
const mocks = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("@/lib/public-charity-education", () => ({
  getReviewedGivingEducation: mocks.get,
}));
import GivingEducationPage, { metadata } from "./page";

describe("public Islamic giving learning page", () => {
  it("is not indexable during editorial development and never implies Zakat approval", () => {
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toEqual({ canonical: "/giving/learn" });
  });
  it("renders an honest empty state when no reviewed content exists", async () => {
    mocks.get.mockResolvedValueOnce([]);
    const html = renderToStaticMarkup(await GivingEducationPage());
    expect(html).toContain("have not been published yet");
    expect(html).toContain("does not issue fatwas");
    expect(html).not.toContain("Read reviewed reflection");
  });
  it("links each actually reviewed item to its canonical original publication", async () => {
    mocks.get.mockResolvedValueOnce([{
      id: "synthetic-reviewed", slug: "eligible-review",
      title: "Source-checked generosity", excerpt: "Published editorial excerpt.",
      type: "ARTICLE", sourceCitation: "Reviewed source", verifiedAt: new Date(),
      status: "PUBLISHED", religiousReviewStatus: "VERIFIED",
      topics: [{ topic: {slug: "sadaqah", name: "Sadaqah"} }],
    }]);
    const html = renderToStaticMarkup(await GivingEducationPage());
    expect(html).toContain('href="/faith-and-reflections/eligible-review"');
    expect(html).toContain("Reviewed source");
    expect(html).not.toContain("have not been published yet");
  });
});
