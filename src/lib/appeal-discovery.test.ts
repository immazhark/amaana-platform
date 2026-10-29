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
it("finds approved appeal titles with extra internal whitespace", () => {
  const items = [{ title: "Emergency   Relief", summary: "Verified support" }];
  const result = selectAppealDiscovery(items, { q: "emergency relief" });
  expect(result).toMatchObject({ invalid: false, count: 1 });
  expect(result.results).toEqual(items);
});

it("bounds pages after search while preserving total count and source order", () => {
 const items = Array.from({length:25}, (_, i) => ({title:`Reviewed ${i}`,summary:"Support"}));
 expect(selectAppealDiscovery(items, {}).results).toEqual(items.slice(0,12));
 expect(selectAppealDiscovery(items, {q:"support",page:"2"})).toMatchObject({page:2,totalPages:3,count:25,results:items.slice(12,24)});
 expect(selectAppealDiscovery(items, {page:"999"})).toMatchObject({page:3,results:items.slice(24)});
 expect(selectAppealDiscovery(items, {q:"missing",page:"2"})).toMatchObject({page:1,totalPages:1,count:0,results:[]});
});
it.each(["0","01","-1","1.5","1e3","9007199254740993",["1","2"]])("rejects malformed page %j", page => {
 expect(selectAppealDiscovery(records,{page})).toMatchObject({invalid:true,results:[],q:"",page:1});
});
