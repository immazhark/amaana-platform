import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CURATED_GALLERY_REQUIRED_SERVICE_ID,
  isCuratedGalleryRuntime,
  assertCuratedGalleryRuntime,
} from "./curated-gallery-server";

afterEach(() => vi.unstubAllEnvs());

describe("curated gallery is unavailable outside its approved staging service", () => {
  it("permits only the exact staging service", () => {
    vi.stubEnv("APP_ENVIRONMENT", "staging");
    vi.stubEnv("RAILWAY_SERVICE_ID", CURATED_GALLERY_REQUIRED_SERVICE_ID);
    expect(isCuratedGalleryRuntime()).toBe(true);
    expect(() => assertCuratedGalleryRuntime()).not.toThrow();
  });

  it("never exposes the importer on production even with an approved service ID", () => {
    vi.stubEnv("APP_ENVIRONMENT", "production");
    vi.stubEnv("RAILWAY_SERVICE_ID", CURATED_GALLERY_REQUIRED_SERVICE_ID);
    expect(isCuratedGalleryRuntime()).toBe(false);
    expect(() => assertCuratedGalleryRuntime()).toThrow("staging");
  });

  it("rejects unrelated Railway services even if configured as staging", () => {
    vi.stubEnv("APP_ENVIRONMENT", "staging");
    vi.stubEnv("RAILWAY_SERVICE_ID", "another-service");
    expect(isCuratedGalleryRuntime()).toBe(false);
    expect(() => assertCuratedGalleryRuntime()).toThrow("preview service");
  });

  it("rejects missing deployment context", () => {
    vi.stubEnv("APP_ENVIRONMENT", "");
    vi.stubEnv("RAILWAY_SERVICE_ID", "");
    expect(isCuratedGalleryRuntime()).toBe(false);
  });
});
