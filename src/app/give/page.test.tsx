import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: { fund: { findMany: vi.fn() } } }));
vi.mock("@/lib/donation-payment-details", () => ({ getDonationPaymentDetails: () => ({}) }));

import Page from "./page";

afterEach(() => vi.unstubAllEnvs());

describe("/give activation", () => {
  it("is a real 404 (thrown before streaming) while the switch is off", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "false");
    expect(() => Page({ searchParams: Promise.resolve({}) })).toThrow();
    try { Page({ searchParams: Promise.resolve({}) }); } catch (error) {
      expect(String((error as { digest?: string }).digest)).toContain("404");
    }
  });
  it("is also closed when the switch is unset", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "");
    expect(() => Page({ searchParams: Promise.resolve({}) })).toThrow();
  });
  it("renders once the owner switches it on", () => {
    vi.stubEnv("FUND_GIVING_ENABLED", "true");
    expect(() => Page({ searchParams: Promise.resolve({}) })).not.toThrow();
  });
});
