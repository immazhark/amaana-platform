import { describe, expect, it } from "vitest";
import { selectImpactComparison } from "./impact-comparison";

const publicRecords = [
  { slug: "eid-gift-kits", title: "Eid Gift Kits" },
  { slug: "amaana-taleem", title: "Amaana Taleem" },
  { slug: "qurbani-meat-distribution", title: "Qurbani distribution" },
] as const;

describe("comparison of reviewed published initiative evidence", () => {
  it("keeps published initiative order and displays an invitation until both are selected", () => {
    const result = selectImpactComparison(publicRecords, {});
    expect(result.options).toEqual(publicRecords);
    expect(result.invalid).toBe(false);
    expect(result.requested).toBe(false);
    expect(result.selected).toBeNull();
  });

  it("returns two independent public records in visitor-selected order without aggregating metrics", () => {
    const result = selectImpactComparison(publicRecords, {
      left: "amaana-taleem", right: "eid-gift-kits",
    });
    expect(result.selected?.map(record => record.slug)).toEqual(["amaana-taleem", "eid-gift-kits"]);
    expect(result.invalid).toBe(false);
    expect(result.requested).toBe(true);
  });

  it.each([
    { left: "eid-gift-kits" },
    { right: "amaana-taleem" },
    { left: "", right: "amaana-taleem" },
    { left: "eid-gift-kits", right: "eid-gift-kits" },
    { left: "private-record", right: "amaana-taleem" },
    { left: "eid-gift-kits", right: "private-record" },
    { left: ["eid-gift-kits", "amaana-taleem"], right: "amaana-taleem" },
    { left: "eid-gift-kits", right: ["amaana-taleem", "amaana-taleem"] },
    { left: "eid-gift-kits", right: "amaana-taleem", phone: "PRIVATE_CONTACT" },
    { left: "<script>alert(1)</script>", right: "amaana-taleem" },
  ])("fails closed on incomplete, duplicate, unapproved or private query parameters", search => {
    const result = selectImpactComparison(publicRecords, search);
    expect(result.invalid).toBe(true);
    expect(result.requested).toBe(true);
    expect(result.selected).toBeNull();
    expect(result.options).toEqual(publicRecords);
  });

  it("cannot select a source record not present in the public projection", () => {
    const result = selectImpactComparison(publicRecords.slice(0, 1), {
      left: "eid-gift-kits", right: "amaana-taleem",
    });
    expect(result.selected).toBeNull();
    expect(result.invalid).toBe(true);
  });
});
