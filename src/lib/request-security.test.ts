import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRateLimitClientHash, isRetryableRateLimitConflict } from "./request-security";

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env = {
    ...originalEnv,
    NODE_ENV: "test",
    DONATION_TOKEN_PEPPER: "test-donation-value",
    ASSISTANCE_TOKEN_PEPPER: "test-assistance-value",
    AUTH_RATE_LIMIT_PEPPER: "test-analytics-value",
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

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("test error", {
    code,
    clientVersion: "test",
  });
}

describe("rate-limit client hashing", () => {
  it("keeps donation, assistance and analytics identifiers separated", () => {
    const request = requestFor("203.0.113.10");
    const hashes = new Set([
      getRateLimitClientHash(request, "donation"),
      getRateLimitClientHash(request, "assistance"),
      getRateLimitClientHash(request, "analytics"),
    ]);
    expect(hashes.size).toBe(3);
  });

  it("changes only the assistance hash when its pepper rotates", () => {
    const request = requestFor("203.0.113.10");
    const assistanceBefore = getRateLimitClientHash(request, "assistance");
    const donationBefore = getRateLimitClientHash(request, "donation");
    const analyticsBefore = getRateLimitClientHash(request, "analytics");

    process.env.ASSISTANCE_TOKEN_PEPPER = "rotated-assistance-value";

    expect(getRateLimitClientHash(request, "assistance")).not.toBe(assistanceBefore);
    expect(getRateLimitClientHash(request, "donation")).toBe(donationBefore);
    expect(getRateLimitClientHash(request, "analytics")).toBe(analyticsBefore);
  });

  it("changes only the analytics hash when its pepper rotates", () => {
    const request = requestFor("203.0.113.10");
    const analyticsBefore = getRateLimitClientHash(request, "analytics");
    const donationBefore = getRateLimitClientHash(request, "donation");

    process.env.AUTH_RATE_LIMIT_PEPPER = "rotated-analytics-value";

    expect(getRateLimitClientHash(request, "analytics")).not.toBe(analyticsBefore);
    expect(getRateLimitClientHash(request, "donation")).toBe(donationBefore);
  });

  it("fails closed in production when a workflow pepper is missing", () => {
    process.env = { ...process.env, NODE_ENV: "production" };
    delete process.env.ASSISTANCE_TOKEN_PEPPER;

    expect(() => getRateLimitClientHash(requestFor("203.0.113.10"), "assistance")).toThrow(
      /ASSISTANCE_TOKEN_PEPPER/,
    );

    process.env.ASSISTANCE_TOKEN_PEPPER = "test-assistance-value";
    delete process.env.AUTH_RATE_LIMIT_PEPPER;
    expect(() => getRateLimitClientHash(requestFor("203.0.113.10"), "analytics")).toThrow(
      /AUTH_RATE_LIMIT_PEPPER/,
    );
  });
});

describe("rate-limit transaction retries", () => {
  it("recognizes Prisma transaction write conflicts as retryable", () => {
    expect(isRetryableRateLimitConflict(prismaError("P2034"))).toBe(true);
  });

  it("does not retry unrelated database errors", () => {
    expect(isRetryableRateLimitConflict(prismaError("P2002"))).toBe(false);
    expect(isRetryableRateLimitConflict(new Error("network failure"))).toBe(false);
  });
});
