import { expect, it } from "vitest";
import { FAITH_PAGE_SIZE, selectFaithDiscovery } from "./faith-discovery";
const records = [
  { title: "Synthetic generosity", excerpt: "Reviewed example", type: "ARTICLE" },
  { title: "Synthetic service", excerpt: "Generosity example", type: "REMINDER" },
];
it("intersects title/excerpt text with format and keeps source order", () => {
  expect(selectFaithDiscovery(records, { q: " GENEROSITY " }).results).toEqual(records);
  expect(selectFaithDiscovery(records, { q: "generosity", format: "REMINDER" }).results).toEqual([records[1]]);
  expect(selectFaithDiscovery(records, { format: "VIDEO" }).results).toEqual([]);
  expect(selectFaithDiscovery(records, {}).results).toEqual(records);
});
it.each([{ q: ["one"] }, { format: ["ARTICLE"] }, { format: "PRIVATE" }, { q: "PRIVATE\nVALUE" }, { q: "x".repeat(81) }, { email: "PRIVATE_VALUE" }])("fails closed without reflecting rejected search fields", query => {
  const result = selectFaithDiscovery(records, query);
  expect(result).toMatchObject({ q: "", format: "", invalid: true, active: true, results: [] });
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("ignores bounded tracking and rejects repeated or oversized tracking", () => {
  expect(selectFaithDiscovery(records, { utm_source: "campaign" }).results).toEqual(records);
  expect(selectFaithDiscovery(records, { utm_source: ["one"] }).invalid).toBe(true);
  expect(selectFaithDiscovery(records, { utm_source: "x".repeat(257) }).invalid).toBe(true);
});
it("finds reviewed reflection text separated by irregular whitespace", () => {
  const items = [{ title: "Synthetic\t service", excerpt: "Reviewed example", type: "ARTICLE" }];
  const result = selectFaithDiscovery(items, { q: "synthetic service", format: "ARTICLE" });
  expect(result).toMatchObject({ invalid: false, count: 1 });
  expect(result.results).toEqual(items);
});

it("bounds reviewed results to twelve per page and retains the full match count", () => {
  const items = Array.from({ length: 25 }, (_, i) => ({
    title: "Reviewed item " + (i + 1), excerpt: "Synthetic context", type: "ARTICLE",
  }));
  const first = selectFaithDiscovery(items, {});
  expect(first).toMatchObject({ count: 25, page: 1, totalPages: 3, invalid: false, active: false });
  expect(first.results).toEqual(items.slice(0, FAITH_PAGE_SIZE));
  const middle = selectFaithDiscovery(items, { page: "2" });
  expect(middle).toMatchObject({ count: 25, page: 2, totalPages: 3, invalid: false, active: true });
  expect(middle.results).toEqual(items.slice(FAITH_PAGE_SIZE, 2 * FAITH_PAGE_SIZE));
  const last = selectFaithDiscovery(items, { page: "999" });
  expect(last).toMatchObject({ count: 25, page: 3, totalPages: 3, invalid: false });
  expect(last.results).toEqual(items.slice(24));
});

it("paginates filtered, reviewed records and never retains marketing attribution", () => {
  const items = Array.from({ length: 26 }, (_, i) => ({
    title: "Synthetic reflection " + i, excerpt: "Reviewed service",
    type: i % 2 === 0 ? "ARTICLE" : "REMINDER",
  }));
  const result = selectFaithDiscovery(items, { q: "reviewed", format: "ARTICLE", page: "2", utm_source: "campaign" });
  expect(result).toMatchObject({ count: 13, page: 2, totalPages: 2, invalid: false });
  expect(result.results).toEqual([items[24]]);
  expect(JSON.stringify(result)).not.toContain("campaign");
});

it.each([
  { page: "0" }, { page: "-1" }, { page: "01" }, { page: "1e3" },
  { page: "9007199254740993" }, { page: ["1", "2"] },
  { page: "2", phone: "PRIVATE_CONTACT" },
])("rejects malformed or private pagination parameters: %j", query => {
  const result = selectFaithDiscovery(records, query);
  expect(result).toMatchObject({ invalid: true, active: true, page: 1, count: 0, results: [] });
  expect(JSON.stringify(result)).not.toContain("PRIVATE_CONTACT");
});
