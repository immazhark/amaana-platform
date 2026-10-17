import { describe, expect, it } from "vitest";
import { readLiveRailResponse } from "./live-rail-response";
const item = { id: "appeal-reviewed", kind: "appeal", title: "Reviewed public need", detailsHref: "/appeals/reviewed", supportHref: "/donate/reviewed", eyebrow: {}, detailsCta: {}, supportCta: "unsafe label" };
describe("live rail JSON boundary", () => {
  it("accepts confirmed empty results and derives fixed safe labels and matched links", () => {
    expect(readLiveRailResponse({ items: [] })).toEqual([]);
    expect(readLiveRailResponse({ items: [item] })).toEqual([{ id: item.id, title: item.title, detailsHref: item.detailsHref, supportHref: item.supportHref, eyebrow: "Live appeal", detailsCta: "View", supportCta: "Donate" }]);
  });
  it.each([null, {}, { items: null }, { items: [null] }, { items: Array(5).fill(item) }, { items: [item, item] }])("rejects malformed/oversized/duplicate payload %j", value => {
    expect(readLiveRailResponse(value)).toBeNull();
  });
  it.each([
    { title: {} }, { title: " " }, { title: "x".repeat(301) }, { title: "Control\u0000character" },
    { kind: "initiative" }, { id: "mismatched" }, { detailsHref: "//external.test/appeals/reviewed" },
    { detailsHref: "/appeals/../admin" }, { detailsHref: "/appeals/reviewed?token=private" },
    { supportHref: "javascript:alert(1)" }, { supportHref: "/donate/other" }, { supportHref: "https://external.test/donate/reviewed" },
  ])("rejects untrusted render or destination data %j", patch => {
    expect(readLiveRailResponse({ items: [{ ...item, ...patch }] })).toBeNull();
  });
});
