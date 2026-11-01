import { expect, it } from "vitest";
import { selectAppealDiscovery } from "./appeal-discovery";
import { selectFaithDiscovery } from "./faith-discovery";
import { selectStoryDiscovery } from "./story-discovery";
import { filterWork } from "./work-filters";

type DiscoveryResult = { invalid: boolean; count: number; results: unknown; active: boolean; q?: string; query?: string };
type Selector = (raw: string) => DiscoveryResult;

const selectors: ReadonlyArray<readonly [string, Selector]> = [
  ["appeals", q => selectAppealDiscovery([{ title: "Warm kits", summary: "Reviewed support" }], { q })],
  ["faith", q => selectFaithDiscovery([{ title: "Warm kits", excerpt: "Reviewed source", type: "ARTICLE" }], { q })],
  ["stories", q => selectStoryDiscovery([{ title: "Warm kits", summary: "Reviewed account", cause: null }], { q })],
  ["our-work", q => filterWork([{ slug: "relief", initiatives: [{
    slug: "warm", title: "Warm kits", summary: "Reviewed aid",
    year: 2026, startYear: null, endYear: null,
  }] }], { q })],
];

it.each(selectors)("%s rejects raw query strings over 80 characters before whitespace normalization", (_, select) => {
  for (const raw of [" ".repeat(81), "warm" + " ".repeat(80), "W ".repeat(41), " ".repeat(10_000)]) {
    const result = select(raw);
    expect(result.invalid).toBe(true);
    expect(result.count).toBe(0);
    expect(result.results).toEqual([]);
    expect(result.active).toBe(true);
    expect(result.q ?? result.query ?? "").toBe("");
    expect(JSON.stringify(result)).not.toContain(raw);
  }
});

it.each(selectors)("%s keeps valid exact-boundary, nonoversized and matching text searches", (_, select) => {
  const limit = select("warm".padEnd(80, " "));
  expect(limit.invalid).toBe(false);
  expect(limit.count).toBe(1);
  const normal = select(" warm ");
  expect(normal.invalid).toBe(false);
  expect(normal.count).toBe(1);
  const blank = select(" ".repeat(80));
  expect(blank.invalid).toBe(false);
  expect(blank.count).toBe(1);
});

it.each(selectors)("%s respects the browser UTF-16 maxLength boundary for astral characters", (_, select) => {
  const exact = select("🔒".repeat(40));
  expect(exact.invalid).toBe(false);
  const overflow = select("🔒".repeat(41));
  expect(overflow.invalid).toBe(true);
  expect(overflow.count).toBe(0);
  expect(overflow.results).toEqual([]);
  expect(overflow.q ?? overflow.query ?? "").toBe("");
});
