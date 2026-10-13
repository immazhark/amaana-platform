import { describe, expect, it } from "vitest";
import { analyticsDateForHyderabad, isTrackablePublicPath, normalizePublicAnalyticsPath, shouldRecordPublicPageView } from "./public-analytics";

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

describe("privacy-safe public analytics grouping", () => {
  it.each([
    ["/appeals/identifiable-medical-case", "/appeals/:slug"],
    ["/stories/recovery-story", "/stories/:slug"],
    ["/our-work/eid-gift-kits-2026", "/our-work/:slug"],
    ["/programmes/ramadan", "/programmes/:slug"],
    ["/faith-and-reflections/daily-reminder", "/faith-and-reflections/:slug"],
    ["/appeals/:slug", "/appeals/:slug"],
    ["/about", "/about"],
  ])("collapses %s to %s idempotently", (input, expected) => {
    expect(normalizePublicAnalyticsPath(input)).toBe(expected);
    expect(normalizePublicAnalyticsPath(expected)).toBe(expected);
  });
  it.each(["/donate", "/request-assistance/status", "/admin", "/appeals/x?token=private", "/stories/x/y"])(
    "rejects sensitive or malformed path %s", path => {
      expect(normalizePublicAnalyticsPath(path)).toBeNull();
    },
  );
});

describe("public page-view integrity and infrastructure usage", () => {
  it("excludes automated acceptance/audit visits before issuing analytics requests", () => {
    expect(shouldRecordPublicPageView("/about", true)).toBe(false);
    expect(shouldRecordPublicPageView("/appeals/appeal-name", true)).toBe(false);
    expect(shouldRecordPublicPageView("/about", false)).toBe(true);
    expect(shouldRecordPublicPageView("/about", false, "/donate")).toBe(false);
    expect(shouldRecordPublicPageView("/appeals/a-name", false, "/request-assistance")).toBe(false);
    expect(shouldRecordPublicPageView("/about", false, "/about")).toBe(true);
    expect(shouldRecordPublicPageView("/admin", false)).toBe(false);
    expect(shouldRecordPublicPageView("/request-assistance", false)).toBe(false);
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
