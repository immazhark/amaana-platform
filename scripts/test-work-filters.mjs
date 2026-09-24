import test from "node:test";
import assert from "node:assert/strict";
import { filterWork } from "../src/lib/work-filters.ts";
const programmes = [
  { slug: "food", initiatives: [{ year: 2026, startYear: null, endYear: null, title: "Dates" }] },
  { slug: "education", initiatives: [{ year: null, startYear: 2023, endYear: 2025, title: "Learning" }] },
  { slug: "empty", initiatives: [] },
];
test("all records retain their content; options use actual recorded years", () => {
  const result = filterWork(programmes, {});
  assert.equal(result.count, 2);
  assert.deepEqual(result.years, [2026, 2025, 2024, 2023]);
  assert.equal(result.results[0].initiatives[0].title, "Dates");
});
test("programme and year intersect, including multi-year initiatives", () => {
  assert.equal(filterWork(programmes, { programme: "education", year: "2024" }).count, 1);
  assert.equal(filterWork(programmes, { programme: "food", year: "2024" }).count, 0);
});
test("unknown, malformed and duplicate query values do not silently show all work", () => {
  for (const search of [{ year: "2024x" }, { year: "02024" }, { programme: "unknown" }, { year: ["2024", "2026"] }]) {
    assert.equal(filterWork(programmes, search).invalid, true);
    assert.equal(filterWork(programmes, search).count, 0);
  }
});
test("empty archive and open-ended dates do not invent years", () => {
  assert.deepEqual(filterWork([], {}).years, []);
  assert.deepEqual(filterWork([{ slug: "aid", initiatives: [{ year: null, startYear: 2020, endYear: null }] }], {}).years, [2020]);
});
