import { afterEach, describe, expect, it, vi } from "vitest";

describe("Next image optimizer local artwork policy", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("keeps real public artwork accessible alongside queried browser fixtures", async () => {
    vi.stubEnv("AMAANA_BROWSER_ACCEPTANCE", "true");
    vi.resetModules();
    const { default: config } = await import("../../next.config");

    // Setting a single localPattern replaces Next's default local image rules.
    // Acceptance builds must cover real hero artwork, not only the test route.
    expect(config.images?.localPatterns).toEqual([{ pathname: "/**" }]);
  });

  it("does not broaden production optimizer configuration for acceptance fixtures", async () => {
    vi.stubEnv("AMAANA_BROWSER_ACCEPTANCE", "false");
    vi.resetModules();
    const { default: config } = await import("../../next.config");

    expect(config.images?.localPatterns).toBeUndefined();
  });
});
