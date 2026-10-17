import { afterEach, describe, expect, it, vi } from "vitest";
import { fundCheckoutIds, isFundCheckoutEnabled } from "./fund-checkout-policy";
const id = "cmf1234567890123456789012";
describe("server-only fund release policy", () => {
  afterEach(() => vi.unstubAllEnvs());
  it.each(["", "false", "TRUE", "1"])("does not activate from flag %s", flag => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", flag); vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", id);
    expect(isFundCheckoutEnabled(id)).toBe(false);
  });
  it("requires exact explicit identifiers and filters malformed list entries", () => {
    vi.stubEnv("AMAANA_FUND_CHECKOUT_ENABLED", "true"); vi.stubEnv("AMAANA_FUND_CHECKOUT_ALLOWLIST", `${id}, ${id}, *, ../fund`);
    expect(fundCheckoutIds()).toEqual([id]); expect(isFundCheckoutEnabled(id)).toBe(true);
    expect(isFundCheckoutEnabled("another-fund")).toBe(false);
  });
});
