import { expect, it } from "vitest";
import { projectCanonicalWork } from "./canonical-work-projection";

it("excludes noncanonical outcomes and preserves canonical initiative order and identity", () => {
  const initiatives = [
    { id: "legacy", slug: "legacy-orphan", title: "Legacy", primaryMetric: "12", primaryMetricLabel: "kits" },
    { id: "reviewed", slug: "reviewed-annual", title: "Reviewed", primaryMetric: "8", primaryMetricLabel: "kits" },
    { id: "unknown", slug: "unknown-2", title: "Unknown", primaryMetric: "40", primaryMetricLabel: "kits" },
  ];
  const resolve = (slug: string) =>
    slug === "reviewed-annual" ? { causeSlug: "relief", parentSlug: "reviewed-parent" } : undefined;
  const result = projectCanonicalWork(initiatives, resolve);
  expect(result.canonicalInitiatives.map(item => item.slug)).toEqual(["reviewed-annual"]);
  expect(result.canonicalInitiatives[0]).toMatchObject({ id: "reviewed", parentSlug: "reviewed-parent" });
  expect(result.publishedOutcomes).toEqual([
    { slug: "reviewed-annual", title: "Reviewed", value: "8", label: "kits" },
  ]);
});

it("preserves canonical umbrella and edition relationships, omitting incomplete outcome metrics", () => {
  const initiatives = [
    { slug: "umbrella", title: "Umbrella", primaryMetric: null, primaryMetricLabel: "families" },
    { slug: "annual", title: "Annual", primaryMetric: "25", primaryMetricLabel: "students" },
    { slug: "another", title: "Another", primaryMetric: "50", primaryMetricLabel: null },
  ];
  const result = projectCanonicalWork(initiatives, slug => ({
    causeSlug: "education", ...(slug === "annual" ? { parentSlug: "umbrella" } : {}),
  }));
  expect(result.canonicalInitiatives.map(item => [item.slug, item.parentSlug])).toEqual([
    ["umbrella", null], ["annual", "umbrella"], ["another", null],
  ]);
  expect(result.publishedOutcomes.map(item => item.slug)).toEqual(["annual"]);
});

it("does not mutate published records, rewrite approved copy or invent unknown programme metrics", () => {
  const records = Object.freeze([
    { slug: "reviewed", title: "  Reviewed work ", primaryMetric: "1,001", primaryMetricLabel: "documented kits" },
  ]);
  const result = projectCanonicalWork(records, slug => slug === "reviewed" ? { causeSlug: "relief" } : undefined);
  expect(result.publishedOutcomes).toEqual([
    { slug: "reviewed", title: "  Reviewed work ", value: "1,001", label: "documented kits" },
  ]);
  expect(Object.hasOwn(records[0], "causeSlug")).toBe(false);
  expect(projectCanonicalWork(records, () => undefined)).toEqual({
    canonicalInitiatives: [], publishedOutcomes: [],
  });
});
