import { describe, expect, it } from "vitest";
import { shouldAllowIndexing } from "./site-indexing";

describe("shouldAllowIndexing", () => {
  it("allows indexing only when explicitly enabled on the official HTTPS domain", () => {
    expect(shouldAllowIndexing("https://amaanafoundation.org", "true", "production")).toBe(true);
    expect(shouldAllowIndexing("https://www.amaanafoundation.org", "true", "production")).toBe(true);
  });

  it("keeps staging and accidental hosts non-indexable", () => {
    expect(shouldAllowIndexing("https://amaana-staging.up.railway.app", "true", "production")).toBe(false);
    expect(shouldAllowIndexing("https://preview.example.com", "true", "production")).toBe(false);
  });

  it("keeps the official hostname non-indexable when the application environment is staging", () => {
    expect(shouldAllowIndexing("https://amaanafoundation.org", "true", "staging")).toBe(false);
    expect(shouldAllowIndexing("https://www.amaanafoundation.org", "true", "staging")).toBe(false);
  });


  it("requires the explicit flag and HTTPS", () => {
    expect(shouldAllowIndexing("https://amaanafoundation.org", undefined, "production")).toBe(false);
    expect(shouldAllowIndexing("https://amaanafoundation.org", "false", "production")).toBe(false);
    expect(shouldAllowIndexing("http://amaanafoundation.org", "true", "production")).toBe(false);
  });

  it("fails closed for invalid URLs", () => {
    expect(shouldAllowIndexing("not-a-url", "true", "production")).toBe(false);
  });
});
