import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ count: vi.fn(), create: vi.fn(), transaction: vi.fn() }));
vi.mock("./prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
import { enforceAcknowledgementRateLimit, enforceAssistanceRateLimit, enforceTrackingRateLimit, getRateLimitClientHash } from "./request-security";

const request = new Request("https://amaanafoundation.org/api/assistance/status", {
  headers: { "x-real-ip": "203.0.113.10" },
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("ASSISTANCE_TOKEN_PEPPER", "synthetic-assistance-pepper");
  vi.stubEnv("DONATION_TOKEN_PEPPER", "synthetic-donation-pepper");
  vi.stubEnv("AUTH_RATE_LIMIT_PEPPER", "synthetic-analytics-pepper");
  mocks.transaction.mockImplementation(operation => operation({ donationAttempt: { count: mocks.count, create: mocks.create } }));
});
afterEach(() => vi.unstubAllEnvs());

describe("independent assistance tracking allowance", () => {
  it("admits the sixtieth lookup and denies the sixty-first without writing a slot", async () => {
    mocks.count.mockResolvedValueOnce(59).mockResolvedValueOnce(60);
    expect(await enforceTrackingRateLimit(request)).toBe(true);
    expect(await enforceTrackingRateLimit(request)).toBe(false);
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(mocks.count).toHaveBeenCalledWith({ where: {
      clientHash: getRateLimitClientHash(request, "tracking"), createdAt: { gte: expect.any(Date) },
    } });
    expect(mocks.transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });

  it("keeps the three-submission assistance quota independent", async () => {
    const counts = new Map<string, number>();
    mocks.count.mockImplementation(({ where }) => counts.get(where.clientHash) ?? 0);
    mocks.create.mockImplementation(({ data }) => counts.set(data.clientHash, (counts.get(data.clientHash) ?? 0) + 1));
    for (let i = 0; i < 60; i++) expect(await enforceTrackingRateLimit(request)).toBe(true);
    expect(await enforceTrackingRateLimit(request)).toBe(false);
    for (let i = 0; i < 30; i++) expect(await enforceAcknowledgementRateLimit(request)).toBe(true);
    expect(await enforceAcknowledgementRateLimit(request)).toBe(false);
    for (let i = 0; i < 3; i++) expect(await enforceAssistanceRateLimit(request)).toBe(true);
    expect(await enforceAssistanceRateLimit(request)).toBe(false);
  });

  it("separates workflow hashes and follows only the assistance pepper", () => {
    const hash = getRateLimitClientHash(request, "tracking");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    for (const purpose of ["assistance", "donation", "analytics", "acknowledgement"] as const)
      expect(hash).not.toBe(getRateLimitClientHash(request, purpose));
    vi.stubEnv("DONATION_TOKEN_PEPPER", "rotated-donation-pepper");
    expect(getRateLimitClientHash(request, "tracking")).toBe(hash);
    vi.stubEnv("ASSISTANCE_TOKEN_PEPPER", "rotated-assistance-pepper");
    expect(getRateLimitClientHash(request, "tracking")).not.toBe(hash);
  });
});
