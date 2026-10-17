import { describe, expect, it } from "vitest";
import { unstable_getResponseFromNextConfig } from "next/experimental/testing/server";
import config from "../../next.config";

describe("effective Next private response policy", () => {
  it.each([
    "/api/donations/acknowledgement", "/api/assistance/status", "/api/donations/confirm",
    "/admin/login", "/donate", "/donate/synthetic-appeal",
    "/donations/synthetic-reference/acknowledgement", "/request-assistance/status",
  ])("does not send referrers from %s", async path => {
    const response = await unstable_getResponseFromNextConfig({ url: `https://amaanafoundation.org${path}`, nextConfig: config });
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toMatch(/private.*no-store/i);
    expect(response.headers.get("content-security-policy")).toContain("default-src 'self'");
  });

  it.each(["/", "/about", "/our-work"])("preserves the public policy for %s", async path => {
    const response = await unstable_getResponseFromNextConfig({ url: `https://amaanafoundation.org${path}`, nextConfig: config });
    expect(response.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  });
});
