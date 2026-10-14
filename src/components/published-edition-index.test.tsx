import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { approvedEditionTimeline, PublishedEditionIndex, type PublishedEdition } from "./published-edition-index";
const editions: PublishedEdition[] = [
  { slug: "drive-2026", title: "Drive 2026", year: 2026, startYear: null, endYear: null,
    primaryMetric: "710", primaryMetricLabel: "kits delivered" },
  { slug: "drive-2025", title: "Drive 2025", year: 2025, startYear: null, endYear: null,
    primaryMetric: "772", primaryMetricLabel: "kits delivered" },
];
describe("published yearly programme index", () => {
  it("sorts documented editions chronologically without adding outcomes", () => {
    const ordered = approvedEditionTimeline(editions);
    expect(ordered.map(x=>x.period)).toEqual(["2025","2026"]);
    expect(ordered.map(x=>x.metric)).toEqual(["772","710"]);
    expect(ordered.every(x=>!Object.hasOwn(x,"fundraisingGoal"))).toBe(true);
  });
  it("provides accessible annual edition routes and no invented fundraising progress", () => {
    const html = renderToStaticMarkup(<PublishedEditionIndex editions={editions}/>);
    expect(html).toContain("/our-work/drive-2025");
    expect(html).toContain("/our-work/drive-2026");
    expect(html.indexOf("Drive 2025")).toBeLessThan(html.indexOf("Drive 2026"));
    expect(html).toContain('aria-label="Published programme edition index"');
    expect(html).toContain("not live donation totals");
    expect(html).not.toContain('role="progressbar"');
  });
  it("omits empty, unpublished-at-call-site, duplicate, malformed, or unlabelled metrics", () => {
    const ordered = approvedEditionTimeline([
      ...editions, editions[0]!,
      { ...editions[0]!, slug: "../admin" },
      { ...editions[0]!, slug: "no-year", year: null, startYear: null, endYear: null },
      { ...editions[0]!, slug: "no-label", primaryMetricLabel: "" },
    ]);
    expect(ordered.map(x=>x.slug)).toEqual(["drive-2025","drive-2026","no-label"]);
    expect(ordered[2]?.metric).toBeNull();
  });
  it("does not invent a year index when only one annual edition is published", () => {
    expect(renderToStaticMarkup(<PublishedEditionIndex editions={editions.slice(0,1)}/>)).toBe("");
  });
});
