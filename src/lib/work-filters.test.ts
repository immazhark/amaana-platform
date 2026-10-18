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
    expect(result.results[0].initiatives).toHaveLength(1);
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

  it("keeps legitimate empty native GET controls valid", () => {
    expect(filterWork(categories, { programme: "", year: "" }).invalid).toBe(false);
  });
});
