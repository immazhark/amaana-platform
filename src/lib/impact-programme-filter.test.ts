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

  it("does not advertise missing or unpublished programme categories", () => {
    const result = filterImpactByProgramme(initiatives.slice(0, 1), {}, areas, item => item.causeSlug);
    expect(result.options).toEqual([{ slug: "ramadan-eid", title: "Ramadan & Eid", count: 1 }]);
  });
});
