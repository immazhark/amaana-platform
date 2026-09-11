import { describe, expect, it } from "vitest";
import { shouldAllowIndexing } from "./site-indexing";

describe("shouldAllowIndexing", () => {
  it("allows indexing only when explicitly enabled on the official HTTPS domain", () => {
    expect(shouldAllowIndexing("https://amaanafoundation.org", "true")).toBe(true);
    expect(shouldAllowIndexing("https://www.amaanafoundation.org", "true")).toBe(true);
  });

  it("keeps staging and accidental hosts non-indexable", () => {
    expect(shouldAllowIndexing("https://amaana-staging.up.railway.app", "true")).toBe(false);
    expect(shouldAllowIndexing("https://preview.example.com", "true")).toBe(false);
  });

  it("requires the explicit flag and HTTPS", () => {
    expect(shouldAllowIndexing("https://amaanafoundation.org", undefined)).toBe(false);
    expect(shouldAllowIndexing("https://amaanafoundation.org", "false")).toBe(false);
    expect(shouldAllowIndexing("http://amaanafoundation.org", "true")).toBe(false);
  });

  it("fails closed for invalid URLs", () => {
    expect(shouldAllowIndexing("not-a-url", "true")).toBe(false);
  });
});
