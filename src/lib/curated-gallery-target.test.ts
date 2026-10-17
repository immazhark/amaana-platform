import { describe, expect, it } from "vitest";
import { CURATED_GALLERY_REQUIRED_SERVICE_ID, isApprovedCuratedGalleryTarget } from "./curated-gallery-target";

describe("staging-only curated ZIP build boundary", () => {
  it("includes importer bytes only in the explicitly approved staging build", () => {
    expect(isApprovedCuratedGalleryTarget("staging", CURATED_GALLERY_REQUIRED_SERVICE_ID)).toBe(true);
  });
  it.each([
    ["production", CURATED_GALLERY_REQUIRED_SERVICE_ID],
    ["development", CURATED_GALLERY_REQUIRED_SERVICE_ID],
    ["staging", "another-railway-service"],
    [undefined, undefined],
    ["staging", undefined],
  ])("excludes the importer for the %s service configuration", (environment, serviceId) => {
    expect(isApprovedCuratedGalleryTarget(environment, serviceId)).toBe(false);
  });
});
