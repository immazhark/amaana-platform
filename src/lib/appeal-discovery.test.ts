import { expect, it } from "vitest";
import { selectAppealDiscovery } from "./appeal-discovery";

const records = [{ title: "Winter support", summary: "Reviewed blankets" }, { title: "Education", summary: "School support" }];
it("matches only reviewed title/summary text and preserves source order", () => {
  expect(selectAppealDiscovery(records, { q: "  SUPPORT  " }).results).toEqual(records);
  expect(selectAppealDiscovery(records, { q: "BLANKETS" }).results).toEqual([records[0]]);
  expect(selectAppealDiscovery(records, { q: "missing" }).count).toBe(0);
  expect(selectAppealDiscovery(records, { q: "" }).results).toEqual(records);
});
it.each([{ q: ["one", "two"] }, { q: "x".repeat(81) }, { q: "PRIVATE\nDETAIL" }, { email: "PRIVATE_DETAIL" }])("rejects malformed query without reflecting rejected values", query => {
  const result = selectAppealDiscovery(records, query);
  expect(result).toMatchObject({ q: "", invalid: true, active: true, results: [], count: 0 });
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
});
it("ignores only bounded approved attribution fields without returning their values", () => {
  expect(selectAppealDiscovery(records, { q: "winter", utm_source: "campaign" })).toMatchObject({ invalid: false, count: 1 });
  expect(selectAppealDiscovery(records, { utm_source: ["one"] }).invalid).toBe(true);
});
