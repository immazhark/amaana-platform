import { describe, expect, it } from "vitest";
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
  it.each(canonicalProgrammes)("keeps %s canonical and social URLs aligned", (slug, canonical) => {
    const metadata = programmePageMetadata(slug, canonical);
    expect(metadata.title).toBeTruthy();
    expect(metadata.description).toBeTruthy();
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.openGraph?.url).toBe(canonical);
    expect(metadata.openGraph?.title).toContain("Amaana Foundation");
    expect(metadata.twitter?.title).toContain("Amaana Foundation");
  });
});
