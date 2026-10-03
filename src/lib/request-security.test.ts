import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getRateLimitClientAddress, getRateLimitClientHash, isRetryableRateLimitConflict } from "./request-security";

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
    headers: {
      host: "amaanafoundation.org",
      "x-real-ip": address,
      "x-forwarded-for": `198.51.100.8, ${address}`,
    },
  });
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("test error", {
    code,
    clientVersion: "test",
  });
}

describe("proxy-aware client address selection", () => {
  it("uses Cloudflare's single-value visitor header on the configured custom domain", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://amaanafoundation.org";
    const request = new Request("https://amaanafoundation.org/", {
      headers: {
        host: "amaanafoundation.org",
        "cf-connecting-ip": "203.0.113.10",
        "x-real-ip": "198.51.100.20",
        "x-forwarded-for": "192.0.2.9, 198.51.100.20",
      },
    });
    expect(getRateLimitClientAddress(request)).toBe("203.0.113.10");
  });

  it("prefers Railway X-Real-IP for the direct staging host", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://amaana-rebuild-preview-production.up.railway.app";
    const request = new Request("https://amaana-rebuild-preview-production.up.railway.app/", {
      headers: {
        host: "amaana-rebuild-preview-production.up.railway.app",
        "cf-connecting-ip": "203.0.113.99",
        "x-real-ip": "198.51.100.20",
        "x-forwarded-for": "192.0.2.9, 198.51.100.20",
      },
    });
    expect(getRateLimitClientAddress(request)).toBe("198.51.100.20");
  });

  it("does not trust the first X-Forwarded-For hop when stronger proxy headers are absent", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    const request = new Request("https://example.test/", {
      headers: {
        "x-forwarded-for": "203.0.113.250, 198.51.100.20",
      },
    });
    expect(getRateLimitClientAddress(request)).toBe("198.51.100.20");
  });

  it("rejects malformed proxy-address headers", () => {
    const request = new Request("https://example.test/", {
      headers: {
        "x-real-ip": "not-an-ip",
        "x-forwarded-for": "also-not-an-ip",
      },
    });
    expect(getRateLimitClientAddress(request)).toBe("unknown");
  });
});

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
