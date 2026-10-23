import { describe, expect, it } from "vitest";
import { filterWork } from "./work-filters";

const categories = [
  { slug: "ramadan-eid", initiatives: [{ year: 2026, startYear: null, endYear: null }, { year: 2025, startYear: null, endYear: null }] },
  { slug: "amaana-taleem", initiatives: [{ year: 2026, startYear: null, endYear: null }] },
];

describe("published work filter validation", () => {
  it("preserves default categories, count and descending year options", () => {
    const result = filterWork(categories, {});
    expect(result.results).toEqual(categories);
    expect(result.count).toBe(3);
    expect(result.years).toEqual([2026, 2025]);
    expect(result).toMatchObject({ programme: "", year: "", active: false, invalid: false });
  });

  it("keeps valid programme and year filters and canonical order", () => {
    const result = filterWork(categories, { programme: "ramadan-eid", year: "2026" });
    expect(result).toMatchObject({ programme: "ramadan-eid", year: "2026", count: 1, active: true, invalid: false });
    expect(result.results.map(x => x.slug)).toEqual(["ramadan-eid"]);
    expect(result.results[0]?.initiatives).toHaveLength(1);
  });

  it.each([
    { programme: "PERSONAL_EMAIL" },
    { year: "private-phone-number" },
    { programme: ["ramadan-eid", "amaana-taleem"] },
    { year: ["2026", "2025"] },
    { year: "9999" },
    { programme: "", year: "", email: "PRIVATE_PERSON" },
    { programme: "ramadan-eid", year: "2026", next: "PRIVATE_PERSON" },
    { programme: "<img onerror=alert(1)>" },
  ])("fails closed without reflecting browser-provided invalid values", search => {
    const result = filterWork(categories, search);
    expect(result).toMatchObject({ programme: "", year: "", invalid: true, active: true, results: [], count: 0 });
    expect(JSON.stringify(result)).not.toContain("PERSONAL_EMAIL");
    expect(JSON.stringify(result)).not.toContain("PRIVATE_PERSON");
    expect(JSON.stringify(result)).not.toContain("private-phone-number");
  });

  it("keeps approved bounded marketing attribution invisible while applying reviewed filters", () => {
    const result = filterWork(categories, {
      programme: "ramadan-eid", year: "2026",
      utm_source: "outreach", utm_campaign: "eid-drive", gclid: "click-token",
    });
    expect(result).toMatchObject({ programme: "ramadan-eid", year: "2026", invalid: false, count: 1 });
    expect(JSON.stringify(result)).not.toContain("outreach");
    expect(JSON.stringify(result)).not.toContain("click-token");
  });

  it("still rejects unknown personal fields, repeated tracking values and oversized tokens", () => {
    for (const search of [
      { programme: "ramadan-eid", utm_source: ["one", "two"] },
      { programme: "ramadan-eid", utm_source: "x".repeat(257) },
      { programme: "ramadan-eid", email: "private@example.org" },
    ]) {
      const result = filterWork(categories, search);
      expect(result).toMatchObject({ invalid: true, results: [], count: 0 });
      expect(JSON.stringify(result)).not.toContain("private@example.org");
    }
  });

  it("keeps legitimate empty native GET controls valid", () => {
    expect(filterWork(categories, { programme: "", year: "" }).invalid).toBe(false);
  });
});


describe("programme families in the published portfolio", () => {
  const programmes = [{ slug: "ramadan-eid", initiatives: [
    { slug: "dates", year: null, startYear: 2023, endYear: 2026 },
    { slug: "dates-2025", parentSlug: "dates", year: 2025, startYear: null, endYear: null },
    { slug: "dates-2026", parentSlug: "dates", year: 2026, startYear: null, endYear: null },
    { slug: "standalone", year: 2025, startYear: null, endYear: null },
  ] }, { slug: "education", initiatives: [
    { slug: "taleem", year: null, startYear: null, endYear: null },
    { slug: "taleem-2022", parentSlug: "taleem", year: 2022, startYear: null, endYear: null },
  ] }];

  it("shows umbrella records by default while retaining child-only year choices", () => {
    const result = filterWork(programmes, {});
    expect(result.results.flatMap(p => p.initiatives.map(i => i.slug))).toEqual(["dates", "standalone", "taleem"]);
    expect(result.years).toEqual([2026, 2025, 2024, 2023, 2022]);
    expect(result.count).toBe(3);
  });

  it("returns an annual edition once instead of its umbrella as another result", () => {
    const result = filterWork(programmes, { programme: "ramadan-eid", year: "2025" });
    expect(result.results[0]?.initiatives.map(i => i.slug)).toEqual(["dates-2025", "standalone"]);
    expect(result.count).toBe(2);
    expect(result.years).toEqual(filterWork(programmes, {}).years);
  });

  it("keeps a matching umbrella when no published edition covers the requested year", () => {
    const result = filterWork(programmes, { year: "2024" });
    expect(result.results[0]?.initiatives.map(i => i.slug)).toEqual(["dates"]);
  });

  it("finds an edition whose umbrella has no dates and preserves the input", () => {
    const snapshot = structuredClone(programmes);
    const result = filterWork(programmes, { programme: "education", year: "2022" });
    expect(result.results[0]?.initiatives.map(i => i.slug)).toEqual(["taleem-2022"]);
    expect(programmes).toEqual(snapshot);
  });
});


it("keeps a published edition discoverable when its umbrella is unpublished", () => {
  const result = filterWork([{ slug: "education", initiatives: [
    { slug: "taleem-2025", parentSlug: "taleem", year: 2025, startYear: null, endYear: null },
  ] }], {});
  expect(result.count).toBe(1);
  expect(result.results[0]?.initiatives[0]?.slug).toBe("taleem-2025");
});
