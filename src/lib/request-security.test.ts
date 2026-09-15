import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRateLimitClientHash } from "./request-security";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DONATION_TOKEN_PEPPER: "donation-secret",
    ASSISTANCE_TOKEN_PEPPER: "assistance-secret",
  };
});

afterEach(() => {
  process.env = { ...originalEnv };
});

function requestFor(address: string) {
  return new Request("https://amaanafoundation.org/", {
    headers: { "x-forwarded-for": `${address}, 10.0.0.1` },
  });
}

describe("rate-limit client hashing", () => {
  it("keeps donation and assistance identifiers cryptographically separated", () => {
    const request = requestFor("203.0.113.10");
    expect(getRateLimitClientHash(request, "donation")).not.toBe(
      getRateLimitClientHash(request, "assistance"),
    );
  });

  it("changes the assistance hash when only the assistance pepper rotates", () => {
    const request = requestFor("203.0.113.10");
    const before = getRateLimitClientHash(request, "assistance");
    const donationBefore = getRateLimitClientHash(request, "donation");

    process.env.ASSISTANCE_TOKEN_PEPPER = "assistance-secret-rotated";

    expect(getRateLimitClientHash(request, "assistance")).not.toBe(before);
    expect(getRateLimitClientHash(request, "donation")).toBe(donationBefore);
  });

  it("fails closed in production when the workflow-specific pepper is missing", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.ASSISTANCE_TOKEN_PEPPER;

    expect(() => getRateLimitClientHash(requestFor("203.0.113.10"), "assistance")).toThrow(
      /ASSISTANCE_TOKEN_PEPPER/,
    );
  });
});
