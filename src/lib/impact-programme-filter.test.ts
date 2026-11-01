import { describe, expect, it } from "vitest";
import { filterImpactByProgramme } from "./impact-programme-filter";

const areas = [
  { slug: "ramadan-eid", title: "Ramadan & Eid" },
  { slug: "amaana-taleem", title: "Amaana Taleem" },
  { slug: "medical-financial-relief", title: "Medical and financial assistance" },
];
const initiatives = [
  { slug: "eid-gift-kits", title: "Eid kits", causeSlug: "ramadan-eid" },
  { slug: "taleem", title: "Education", causeSlug: "amaana-taleem" },
  { slug: "qurbani-meat-distribution", title: "Qurbani", causeSlug: "ramadan-eid" },
];

describe("impact programme discovery", () => {
  it("does not hide or reorder published records in the default view", () => {
    const result = filterImpactByProgramme(initiatives, {}, areas, item => item.causeSlug);
    expect(result.results.map(x => x.slug)).toEqual([
      "eid-gift-kits", "taleem", "qurbani-meat-distribution",
    ]);
    expect(result.options.map(x => [x.slug, x.count])).toEqual([
      ["ramadan-eid", 2], ["amaana-taleem", 1],
    ]);
    expect(result.active).toBe(false);
    expect(result.invalid).toBe(false);
    expect(result.count).toBe(3);
  });

  it("filters using locked programme categories and preserves the canonical order", () => {
    const result = filterImpactByProgramme(initiatives, { programme: "ramadan-eid" }, areas, item => item.causeSlug);
    expect(result.results.map(x => x.slug)).toEqual(["eid-gift-kits", "qurbani-meat-distribution"]);
    expect(result.count).toBe(2);
    expect(result.programme).toBe("ramadan-eid");
    expect(result.active).toBe(true);
  });

  it.each([
    { programme: ["ramadan-eid", "amaana-taleem"] },
    { programme: ["ramadan-eid", "ramadan-eid"] },
    { programme: "unauthorized-programme" },
    { programme: "<img src=x onerror=alert(1)>" },
    { programme: "" , unexpected: "PRIVATE_PERSONAL_DATA" },
  ])("rejects ambiguous, unpublished or unsupported query parameters", search => {
    const result = filterImpactByProgramme(initiatives, search, areas, item => item.causeSlug);
    expect(result.invalid).toBe(true);
    expect(result.active).toBe(true);
    expect(result.results).toEqual([]);
    expect(result.programme).toBe("");
  });

  it("keeps programmes discoverable behind bounded campaign-tracking links without reflecting tokens", () => {
    const result = filterImpactByProgramme(initiatives, {
      programme: "ramadan-eid", utm_source: "outreach", fbclid: "private-token",
    }, areas, item => item.causeSlug);
    expect(result).toMatchObject({ programme: "ramadan-eid", invalid: false, count: 2 });
    expect(JSON.stringify(result)).not.toContain("outreach");
    expect(JSON.stringify(result)).not.toContain("private-token");
  });

  it("still rejects malformed tracking and personal query parameters", () => {
    for (const search of [
      { programme: "ramadan-eid", fbclid: ["one", "two"] },
      { programme: "ramadan-eid", utm_campaign: "x".repeat(257) },
      { programme: "ramadan-eid", email: "private@example.org" },
    ]) {
      const result = filterImpactByProgramme(initiatives, search, areas, item => item.causeSlug);
      expect(result).toMatchObject({ invalid: true, count: 0, results: [] });
      expect(JSON.stringify(result)).not.toContain("private@example.org");
    }
  });

  it("does not advertise missing or unpublished programme categories", () => {
    const result = filterImpactByProgramme(initiatives.slice(0, 1), {}, areas, item => item.causeSlug);
    expect(result.options).toEqual([{ slug: "ramadan-eid", title: "Ramadan & Eid", count: 1 }]);
  });

  it("classifies each published initiative only once when building programme options", () => {
    const causeLookups: string[] = [];
    const result = filterImpactByProgramme(initiatives, {}, areas, item => {
      causeLookups.push(item.slug);
      return item.causeSlug;
    });
    expect(causeLookups).toEqual(initiatives.map(item => item.slug));
    expect(result.results).toEqual(initiatives);
    expect(result.results).not.toBe(initiatives);
    expect(result.options.map(option => [option.slug, option.count])).toEqual([
      ["ramadan-eid", 2], ["amaana-taleem", 1],
    ]);
  });

  it("reuses each classification for selected or invalid public filters", () => {
    for (const search of [
      { programme: "ramadan-eid" },
      { programme: "ramadan-eid", email: "PRIVATE" },
    ]) {
      let causeLookups = 0;
      const result = filterImpactByProgramme(initiatives, search, areas, item => {
        causeLookups++;
        return item.causeSlug;
      });
      expect(causeLookups).toBe(initiatives.length);
      expect(result.options.map(option => option.count)).toEqual([2, 1]);
      if ("email" in search) {
        expect(result).toMatchObject({ invalid: true, programme: "", count: 0, results: [] });
        expect(JSON.stringify(result)).not.toContain("PRIVATE");
      } else {
        expect(result).toMatchObject({ invalid: false, programme: "ramadan-eid", count: 2 });
        expect(result.results.map(item => item.slug)).toEqual([
          "eid-gift-kits", "qurbani-meat-distribution",
        ]);
      }
    }
  });

});
