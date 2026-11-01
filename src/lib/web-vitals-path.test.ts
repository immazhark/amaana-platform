import { describe, expect, it } from "vitest";
import { canRecordWebVitalOnCurrentRoute, normalizePublicWebVitalPath } from "./web-vitals-path";

describe("privacy-safe public performance route grouping", () => {
  it.each(["/", "/about", "/appeals", "/stories", "/our-work", "/impact", "/compliance"])(
    "preserves static public route %s", path => {
      expect(normalizePublicWebVitalPath(path)).toBe(path);
    },
  );
  it.each([
    ["/appeals/example-person-medical-aid", "/appeals/:slug"],
    ["/stories/beneficiary-recovery", "/stories/:slug"],
    ["/our-work/eid-gift-kits", "/our-work/:slug"],
    ["/faith-and-reflections/daily-reminder", "/faith-and-reflections/:slug"],
    ["/programmes/seasonal-relief", "/programmes/:slug"],
  ])("collapses potentially identifying slug %s", (raw, expected) => {
    expect(normalizePublicWebVitalPath(raw)).toBe(expected);
  });
  it.each([
    "/appeals/:slug", "/stories/:slug", "/our-work/:slug",
    "/faith-and-reflections/:slug", "/programmes/:slug",
  ])("accepts normalized client route tokens without exposing names: %s", path => {
    expect(normalizePublicWebVitalPath(path)).toBe(path);
  });
  it.each([
    "/admin", "/donate", "/donations/secret-token",
    "/request-assistance", "/request-assistance/status",
    "/appeals/name?secret=1", "/appeals/name#private", "https://amaanafoundation.org/about",
    "//other-domain", "/stories/name/second",
  ])("rejects excluded or malformed pathname %s", value => {
    expect(normalizePublicWebVitalPath(value)).toBeNull();
  });
});

describe("Web Vitals cross-route privacy boundary", () => {
  it("allows a sampled document while it remains on the same public page", () => {
    expect(canRecordWebVitalOnCurrentRoute("/about", "/about")).toBe(true);
    expect(canRecordWebVitalOnCurrentRoute("/appeals/:slug", "/appeals/an-appeal")).toBe(true);
  });
  it("stops the reporter when navigation changes to a private or different section", () => {
    expect(canRecordWebVitalOnCurrentRoute("/about", "/donate")).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute("/about", "/request-assistance/status")).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute("/appeals/:slug", "/admin")).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute("/appeals/:slug", "/stories/a-story")).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute(null, "/about")).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute("/about", "/about", true)).toBe(false);
    expect(canRecordWebVitalOnCurrentRoute("/about", "/about", false)).toBe(true);
  });
});
