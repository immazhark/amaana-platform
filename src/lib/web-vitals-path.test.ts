import { describe, expect, it } from "vitest";
import { canRecordWebVitalOnCurrentRoute, createWebVitalDocumentGuard, normalizePublicWebVitalPath } from "./web-vitals-path";

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
    expect(canRecordWebVitalOnCurrentRoute("/appeals/an-appeal", "/appeals/an-appeal")).toBe(true);
  });
  it("does not equate different public documents just because their slugs share an anonymous bucket", () => {
    for (const section of ["appeals", "stories", "our-work", "programmes", "faith-and-reflections"]) {
      const original = `/${section}/first-document`;
      const later = `/${section}/second-document`;
      expect(normalizePublicWebVitalPath(original)).toBe(normalizePublicWebVitalPath(later));
      expect(canRecordWebVitalOnCurrentRoute(original, original)).toBe(true);
      expect(canRecordWebVitalOnCurrentRoute(original, later)).toBe(false);
      expect(canRecordWebVitalOnCurrentRoute(original, later, true)).toBe(false);
    }
  });
  it("does not interpret a normalized aggregation token as the original document pathname", () => {
    expect(canRecordWebVitalOnCurrentRoute("/appeals/:slug", "/appeals/real-document")).toBe(false);
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

describe("Web Vitals original-document lifecycle boundary", () => {
  it("does not re-admit a public route after SPA navigation leaves and returns", () => {
    const guard = createWebVitalDocumentGuard("/appeals/original-case");
    expect(guard.canRecord("/appeals/original-case")).toBe(true);
    expect(guard.observeRoute("/appeals/another-case")).toBe(false);
    expect(guard.canRecord("/appeals/another-case")).toBe(false);
    expect(guard.observeRoute("/appeals/original-case")).toBe(false);
    expect(guard.canRecord("/appeals/original-case")).toBe(false);
  });

  it("invalidates pending first-document metrics on a private route and keeps the guard closed", () => {
    const guard = createWebVitalDocumentGuard("/about");
    expect(guard.canRecord("/about")).toBe(true);
    expect(guard.observeRoute("/donate")).toBe(false);
    expect(guard.canRecord("/about")).toBe(false);
    expect(guard.observeRoute("/about")).toBe(false);
    expect(guard.canRecord("/about")).toBe(false);
  });

  it("allows repeated observations on the original document without invalidation", () => {
    const guard = createWebVitalDocumentGuard("/stories/one");
    expect(guard.observeRoute("/stories/one")).toBe(true);
    expect(guard.observeRoute("/stories/one")).toBe(true);
    expect(guard.canRecord("/stories/one")).toBe(true);
    expect(guard.canRecord("/stories/one", true)).toBe(false);
  });

  it("never records an originally private or unknown document", () => {
    for (const path of ["/donate", "/admin", null]) {
      const guard = createWebVitalDocumentGuard(path);
      expect(guard.canRecord(path ?? "/about")).toBe(false);
      expect(guard.observeRoute(path)).toBe(false);
    }
  });
});
