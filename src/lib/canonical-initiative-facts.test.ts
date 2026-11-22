import { describe, expect, it } from "vitest";
import { TALEEM_METRIC } from "@/content/taleem-facts";
import { withCanonicalInitiativeFacts, withCanonicalInitiativeFactsList } from "./canonical-initiative-facts";

const stale = { slug: "taleem", title: "Amaana Taleem Initiative", primaryMetric: "25", primaryMetricLabel: "Nazira / Hifdh students combined · September 2026" };

describe("canonical initiative facts overlay", () => {
  it("replaces only the Taleem metric and label, and keeps every other field", () => {
    const result = withCanonicalInitiativeFacts(stale);
    expect(result).toEqual({ slug: "taleem", title: "Amaana Taleem Initiative", primaryMetric: TALEEM_METRIC.value, primaryMetricLabel: TALEEM_METRIC.label });
    expect(stale.primaryMetric).toBe("25"); // the input row is never mutated
  });

  it("returns every other initiative unchanged, by reference", () => {
    const other = { slug: "winter-relief", primaryMetric: "234 Winter Kits", primaryMetricLabel: "distributed" };
    expect(withCanonicalInitiativeFacts(other)).toBe(other);
    const lookalike = { slug: "taleem-initiative-2025", primaryMetric: "50", primaryMetricLabel: "children" };
    expect(withCanonicalInitiativeFacts(lookalike)).toBe(lookalike);
  });

  it("does not add metric fields to a row from a query that did not select them", () => {
    const slugOnly = { slug: "taleem", mediaAssets: [] };
    expect(withCanonicalInitiativeFacts(slugOnly)).toBe(slugOnly);
    expect(withCanonicalInitiativeFacts({ slug: "taleem", primaryMetric: "25" })).toEqual({ slug: "taleem", primaryMetric: "25" });
  });

  it("passes null, primitives, arrays and malformed rows through untouched", () => {
    for (const value of [null, undefined, 7, "taleem", [], [stale]]) expect(withCanonicalInitiativeFacts(value)).toBe(value);
  });

  it("maps a list, leaving non-array results as they are", () => {
    const other = { slug: "winter-relief", primaryMetric: "x", primaryMetricLabel: "y" };
    const list = withCanonicalInitiativeFactsList([other, stale]);
    expect(list[0]).toBe(other);
    expect(list[1]).toMatchObject({ primaryMetric: "26" });
    expect(withCanonicalInitiativeFactsList(null)).toBeNull();
    expect(withCanonicalInitiativeFactsList("x")).toBe("x");
  });

  it("is a harmless no-op once the database row already carries the canonical figure", () => {
    const synced = { slug: "taleem", primaryMetric: TALEEM_METRIC.value, primaryMetricLabel: TALEEM_METRIC.label };
    expect(withCanonicalInitiativeFacts(synced)).toEqual(synced);
  });
});
