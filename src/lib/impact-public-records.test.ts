import { describe, expect, it } from "vitest";
import { retainRenderableImpactRecords } from "./impact-public-records";

const reviewed = {
  id: "synthetic-reviewed", slug: "eid-gift-kits", title: "Eid gift kits",
  cause: { title: "Ramadan & Eid" }, mediaAssets: [],
  primaryMetric: "20", primaryMetricLabel: "kits",
};

describe("impact page public projection boundary", () => {
  it("rejects corrupt rows before the page reads nested route, metric or media fields", () => {
    const malformed = [
      null, undefined,
      { ...reviewed, id: "" },
      { ...reviewed, slug: { private: "PRIVATE_SLUG" } },
      { ...reviewed, title: "" },
      { ...reviewed, cause: null },
      { ...reviewed, cause: { title: { internal: "PRIVATE_CAUSE" } } },
      { ...reviewed, mediaAssets: { private: "PRIVATE_MEDIA" } },
      { ...reviewed, primaryMetric: { internal: "PRIVATE_METRIC" } },
      { ...reviewed, primaryMetricLabel: ["PRIVATE_LABEL"] },
    ] as unknown as Array<typeof reviewed>;
    const projected = retainRenderableImpactRecords([...malformed, reviewed]);
    expect(projected).toEqual([reviewed]);
    expect(JSON.stringify(projected)).not.toContain("PRIVATE_");
  });

  it("preserves the identity and source order of valid published records", () => {
    const second = { ...reviewed, id: "second", slug: "amaana-taleem", title: "Amaana Taleem" };
    expect(retainRenderableImpactRecords([reviewed, second])).toEqual([reviewed, second]);
    expect(retainRenderableImpactRecords([reviewed])[0]).toBe(reviewed);
  });

  it("returns an empty public projection for an invalid collection", () => {
    expect(retainRenderableImpactRecords(null as unknown as Array<typeof reviewed>)).toEqual([]);
  });
});
