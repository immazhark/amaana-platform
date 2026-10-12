import { describe, expect, it } from "vitest";
import { normalizePublicWebVitalPath } from "./web-vitals-path";

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
