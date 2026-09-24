import { describe, expect, it } from "vitest";
import { analyticsDateForHyderabad, isTrackablePublicPath } from "./public-analytics";

describe("isTrackablePublicPath", () => {
  it("tracks public discovery and detail routes", () => {
    expect(isTrackablePublicPath("/")).toBe(true);
    expect(isTrackablePublicPath("/our-work/eid-gift-kits")).toBe(true);
    expect(isTrackablePublicPath("/programmes/ramadan-eid")).toBe(true);
    expect(isTrackablePublicPath("/stories/a-story")).toBe(true);
    expect(isTrackablePublicPath("/faith-and-reflections/a-reminder")).toBe(true);
    expect(isTrackablePublicPath("/appeals/verified-need")).toBe(true);
  });

  it("does not track sensitive, admin or malformed routes", () => {
    expect(isTrackablePublicPath("/request-assistance")).toBe(false);
    expect(isTrackablePublicPath("/donate/example")).toBe(false);
    expect(isTrackablePublicPath("/donations/ABC123")).toBe(false);
    expect(isTrackablePublicPath("/admin")).toBe(false);
    expect(isTrackablePublicPath("/our-work/not valid")).toBe(false);
  });
});

describe("analyticsDateForHyderabad", () => {
  it("rolls the analytics day over at Hyderabad midnight instead of UTC midnight", () => {
    expect(analyticsDateForHyderabad(new Date("2026-09-15T18:29:59.000Z")).toISOString()).toBe(
      "2026-09-15T00:00:00.000Z",
    );
    expect(analyticsDateForHyderabad(new Date("2026-09-15T18:30:00.000Z")).toISOString()).toBe(
      "2026-09-16T00:00:00.000Z",
    );
  });
});
