import { describe, expect, it } from "vitest";
import { retainComparableImpactRecords, selectImpactComparison } from "./impact-comparison";

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

  it("fails closed instead of choosing an arbitrary duplicated public slug", () => {
    const collision = [
      ...publicRecords,
      { slug: "eid-gift-kits", title: "Duplicate synthetic initiative" },
    ];
    const result = selectImpactComparison(collision, {
      left: "eid-gift-kits", right: "amaana-taleem",
    });
    expect(result).toMatchObject({ requested: true, invalid: true, selected: null });
    expect(result.options).toEqual(collision);
  });

  it("cannot select a source record not present in the public projection", () => {
    const result = selectImpactComparison(publicRecords.slice(0, 1), {
      left: "eid-gift-kits", right: "amaana-taleem",
    });
    expect(result.selected).toBeNull();
    expect(result.invalid).toBe(true);
  });
});

describe("campaign-attributed comparison links", () => {
  it("does not treat attribution-only visits as failed comparison submissions", () => {
    const result = selectImpactComparison(publicRecords, { utm_source: "community", fbclid: "ref-token" });
    expect(result).toMatchObject({ requested: false, invalid: false, selected: null });
    expect(JSON.stringify(result)).not.toContain("ref-token");
  });
  it("preserves two approved comparison choices behind bounded marketing parameters", () => {
    const result = selectImpactComparison(publicRecords, {
      left: "amaana-taleem", right: "eid-gift-kits", utm_campaign: "public-programme",
    });
    expect(result.invalid).toBe(false);
    expect(result.selected?.map(item => item.slug)).toEqual(["amaana-taleem", "eid-gift-kits"]);
    expect(JSON.stringify(result)).not.toContain("public-programme");
  });
  it("rejects malformed attribution and unsupported personal URL fields", () => {
    for (const query of [
      { utm_source: ["a", "b"] },
      { utm_source: "x".repeat(257) },
      { left: "eid-gift-kits", right: "amaana-taleem", email: "private@example.org" },
    ]) {
      const result = selectImpactComparison(publicRecords, query);
      expect(result).toMatchObject({ requested: true, invalid: true, selected: null });
      expect(JSON.stringify(result)).not.toContain("private@example.org");
    }
  });
});

describe("public comparison page projection boundary", () => {
  const reviewed = {
    slug: "eid-gift-kits", title: "Eid Gift Kits", summary: "Reviewed public summary",
    cause: { title: "Ramadan & Eid" }, primaryMetric: "42", primaryMetricLabel: "kits",
  };

  it("rejects malformed identity, cause, summary and metric fields before page rendering", () => {
    const withoutMetric = { ...reviewed, slug: "amaana-taleem", primaryMetric: null, primaryMetricLabel: null };
    const malformed = [
      null, undefined,
      { ...reviewed, slug: "../admin" },
      { ...reviewed, slug: "two//slash" },
      { ...reviewed, title: 123 },
      { ...reviewed, cause: null },
      { ...reviewed, cause: { title: { private: "PRIVATE_CAUSE" } } },
      { ...reviewed, summary: { private: "PRIVATE_SUMMARY" } },
      { ...reviewed, primaryMetric: { private: "PRIVATE_METRIC" } },
      { ...reviewed, primaryMetricLabel: ["PRIVATE_LABEL"] },
    ] as unknown as Array<typeof reviewed>;
    const result = retainComparableImpactRecords([...malformed, reviewed, withoutMetric]);
    expect(result).toEqual([reviewed, withoutMetric]);
    expect(JSON.stringify(result)).not.toContain("PRIVATE_");
  });

  it("preserves valid source order without changing the comparison selection semantics", () => {
    const second = { ...reviewed, slug: "amaana-taleem" };
    const records = retainComparableImpactRecords([reviewed, second]);
    expect(records[0]).toBe(reviewed);
    expect(selectImpactComparison(records, { left: second.slug, right: reviewed.slug }).selected)
      .toEqual([second, reviewed]);
    expect(retainComparableImpactRecords(null as unknown as Array<typeof reviewed>)).toEqual([]);
  });
});
