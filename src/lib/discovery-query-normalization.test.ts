import { expect, test, vi } from "vitest";
import { selectAppealDiscovery } from "./appeal-discovery";
import { selectFaithDiscovery } from "./faith-discovery";
import { selectStoryDiscovery } from "./story-discovery";
import { filterWork } from "./work-filters";

const records = Array.from({ length: 20 }, (_, i) => ({ title: `Needle record ${i}`, summary: "Published text", excerpt: "Published text", type: "ARTICLE", year: 2026, startYear: null, endYear: null }));
const selectors = [
  ["Appeals", (q: string) => selectAppealDiscovery(records, { q })],
  ["Faith", (q: string) => selectFaithDiscovery(records, { q })],
  ["Stories", (q: string) => selectStoryDiscovery(records, { q })],
  ["Our Work", (q: string) => filterWork([{ slug: "work", initiatives: records }], { q })],
] as const;

test.each(selectors)("%s folds one search phrase once for all candidates", (_, select) => {
  const spy = vi.spyOn(String.prototype, "toLocaleLowerCase");
  try {
    const result = select("  NeEdLe  ");
    const calls = spy.mock.contexts.filter(value => String(value) === "NeEdLe").length;
    expect(result.count).toBe(20);
    expect(result.invalid).toBe(false);
    expect(calls).toBe(1);
  } finally { spy.mockRestore(); }
});

test.each(selectors)("%s preserves empty and rejected query behavior", (_, select) => {
  expect(select("").count).toBe(20);
  expect(select("\u0000NeEdLe")).toMatchObject({ invalid: true, count: 0 });
  expect(select("missing")).toMatchObject({ invalid: false, count: 0 });
  expect(select("needle RECORD 1").count).toBe(11);
});

test("Stories classifies programme context once per record and preserves result identity", () => {
  let reads = 0;
  const story = { title: "Story", summary: "Public", initiative: { get status() { reads++; return "PUBLISHED"; }, cause: { status: "PUBLISHED", title: "Education" } } };
  const result = selectStoryDiscovery([story], { programme: "Education" });
  expect(result.results[0]).toBe(story);
  expect(result.programmes).toEqual(["Education"]);
  expect(reads).toBe(1);
});

test("Stories preserves published context precedence and private-context exclusion", () => {
  const direct = { status: "PUBLISHED", title: "Direct" };
  const records = [
    { title: "Initiative wins", summary: "Public", cause: direct, initiative: { status: "PUBLISHED", cause: { status: "PUBLISHED", title: "Initiative" } } },
    { title: "Fallback", summary: "Public", cause: direct, initiative: { status: "DRAFT", cause: { status: "PUBLISHED", title: "Hidden" } } },
    { title: "Private", summary: "Public", cause: { status: "DRAFT", title: "Private" } },
    { title: "Blank parent", summary: "Public", cause: direct, initiative: { status: "PUBLISHED", cause: { status: "PUBLISHED", title: "" } } },
  ];
  expect(selectStoryDiscovery(records, {}).programmes).toEqual(["Direct", "Initiative"]);
  expect(selectStoryDiscovery(records, { programme: "Direct" }).results).toEqual([records[1], records[3]]);
  expect(selectStoryDiscovery(records, { programme: "Initiative" }).results).toEqual([records[0]]);
});
