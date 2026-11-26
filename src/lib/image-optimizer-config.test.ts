import { afterEach, describe, expect, it, vi } from "vitest";
const staticPatterns = [
  { pathname: "/brand/**", search: "" },
  { pathname: "/hero/**", search: "" },
  { pathname: "/programme-artwork/**", search: "" },
  { pathname: "/media/*", search: "" },
];

describe("Next image optimizer static artwork policy", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  it("keeps static artwork and only the two nonrevocable fixture query variants", async () => {
    vi.stubEnv("AMAANA_BROWSER_ACCEPTANCE", "true");
    vi.resetModules();
    const { default: config } = await import("../../next.config");
    expect(config.images?.localPatterns).toEqual([...staticPatterns,
      { pathname: "/browser-acceptance/image-cache-source", search: "?policy=bounded" },
      { pathname: "/browser-acceptance/image-cache-source", search: "?policy=immutable" },
    ]);
  });

  it("allows only static artwork in production", async () => {
    vi.stubEnv("AMAANA_BROWSER_ACCEPTANCE", "false");
    vi.resetModules();
    const { default: config } = await import("../../next.config");
    expect(config.images?.localPatterns).toEqual(staticPatterns);
    expect(config.images?.minimumCacheTTL).toBe(60);
  });
});
