import { expect, it } from "vitest";
import { selectFaithDiscovery } from "./faith-discovery";
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
