import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import Page from "./page";

afterEach(() => vi.unstubAllEnvs());

describe("/funds activation", () => {
  it("is a real 404 (thrown before streaming) while the switch is off or unset", () => {
    for (const value of ["false", ""]) {
      vi.stubEnv("FUND_GIVING_ENABLED", value);
      let digest = "";
      try { Page({ searchParams: Promise.resolve({}) }); } catch (error) { digest = String((error as { digest?: string }).digest); }
      expect(digest).toContain("404");
    }
  });
  it("renders once the owner switches it on", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    expect(() => Page({ searchParams: Promise.resolve({}) })).not.toThrow();
  });
});
