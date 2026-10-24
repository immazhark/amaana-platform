import { expect, it } from "vitest";
import { parseLiveRailItems } from "./live-rail";
const valid = { id: "appeal-one", kind: "appeal", eyebrow: "Live appeal", title: "Reviewed support", detailsHref: "/appeals/one", supportHref: "/donate/one", detailsCta: "View", supportCta: "Donate" };
it("preserves valid appeal links and defaults the unused optional subtitle", () => {
  expect(parseLiveRailItems({ items: [valid] })).toEqual([{ ...valid, subtitle: "" }]);
});
it("rejects unsupported destinations and incomplete public actions", () => {
  for (const href of ["javascript:alert(1)", "//outside.example", "/\\outside.example", "/bad path", "https://outside.example"]) {
    expect(parseLiveRailItems({ items: [{ ...valid, detailsHref: href }] })).toEqual([]);
    expect(parseLiveRailItems({ items: [{ ...valid, supportHref: href }] })).toEqual([]);
  }
  for (const change of [{ kind: "other" }, { title: " " }, { detailsCta: {} }, { supportCta: "" }]) {
    expect(parseLiveRailItems({ items: [{ ...valid, ...change }] })).toEqual([]);
  }
});
it("does not rotate more than the public endpoint's four valid updates", () => {
  const parsed = parseLiveRailItems({ items: [null, ...Array.from({ length: 6 }, (_, index) => ({ ...valid, id: String(index) }))] });
  expect(parsed.map(item => item.id)).toEqual(["0", "1", "2", "3"]);
});
