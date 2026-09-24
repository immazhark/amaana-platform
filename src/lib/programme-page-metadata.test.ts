import { beforeEach, describe, expect, it, vi } from "vitest";
import { programmeBySlug } from "@/lib/master-copy";

const getPublishedInitiativeBySlug = vi.fn();

vi.mock("@/lib/public-content", () => ({
  getPublishedInitiativeBySlug,
}));

import { programmePageMetadata } from "@/lib/programme-page-metadata";

const canonicalProgrammes = [
  ["dates-distribution", "/our-work/dates-distribution"],
  ["eid-gift-kits", "/our-work/eid-gift-kits"],
  ["hyderabad-flood-relief-2020", "/our-work/hyderabad-flood-relief-2020"],
  ["qurbani-meat-distribution", "/our-work/qurbani-meat-distribution"],
  ["taleem", "/our-work/taleem"],
  ["winter-relief", "/our-work/winter-relief"],
] as const;

describe("programmePageMetadata", () => {
  beforeEach(() => {
    getPublishedInitiativeBySlug.mockImplementation(async (slug: string) => {
      const programme = programmeBySlug(slug);
      if (!programme) return null;
      return {
        title: programme.title,
        summary: programme.summary,
      };
    });
  });

  it.each(canonicalProgrammes)("keeps %s canonical and social URLs aligned", async (slug, canonical) => {
    const metadata = await programmePageMetadata(slug, canonical);
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.openGraph?.url).toBe(canonical);
    expect(metadata.openGraph?.title).toContain("Amaana Foundation");
    expect(metadata.twitter?.title).toContain("Amaana Foundation");
  });

  it("does not emit canonical metadata for an unpublished programme", async () => {
    getPublishedInitiativeBySlug.mockResolvedValueOnce(null);

    const metadata = await programmePageMetadata("taleem", "/our-work/taleem");

    expect(metadata).toEqual({ title: "Programme not found" });
  });
});
