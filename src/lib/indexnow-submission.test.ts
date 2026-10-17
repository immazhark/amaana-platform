import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ sitemap: vi.fn(), transaction: vi.fn(), recent: vi.fn(), attempt: vi.fn(), outcome: vi.fn(), fetch: vi.fn() }));
vi.mock("@/app/sitemap", () => ({ default: m.sitemap }));
vi.mock("@/lib/prisma", () => ({ prisma: { auditEvent: { create: m.outcome } } }));
vi.mock("@/lib/prisma-transaction", () => ({ withSerializableTransactionRetry: m.transaction }));
import { submitIndexNowPaths } from "./indexnow-submission";
const origin = "https://amaanafoundation.org";
describe("explicit audited IndexNow transport", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    for (const [key, value] of Object.entries({ APP_ENVIRONMENT: "production", NEXT_PUBLIC_APP_URL: origin, NEXT_PUBLIC_ALLOW_INDEXING: "true", AMAANA_INDEXNOW_ENABLED: "true", INDEXNOW_KEY: "synthetic-key-1234" })) vi.stubEnv(key, value);
    vi.stubGlobal("fetch", m.fetch); m.sitemap.mockResolvedValue([{ url: origin + "/about" }]);
    m.transaction.mockImplementation(async fn => fn({ auditEvent: { findFirst: m.recent, create: m.attempt } }));
    m.recent.mockResolvedValue(null); m.attempt.mockResolvedValue({ id: "attempt-id" }); m.outcome.mockResolvedValue({});
    m.fetch.mockResolvedValue(new Response(null, { status: 200 }));
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it("requires configuration before reading publication or doing any work", async () => {
    vi.stubEnv("AMAANA_INDEXNOW_ENABLED", "false"); await expect(submitIndexNowPaths("staff", "/about")).rejects.toThrow("disabled");
    expect(m.sitemap).not.toHaveBeenCalled(); expect(m.transaction).not.toHaveBeenCalled(); expect(m.fetch).not.toHaveBeenCalled();
  });
  it("reads fresh sitemap on every attempt and never transmits a withdrawn or mixed batch", async () => {
    await submitIndexNowPaths("staff", "/about"); m.sitemap.mockResolvedValue([]);
    await expect(submitIndexNowPaths("staff", "/about")).rejects.toThrow("absent"); expect(m.fetch).toHaveBeenCalledTimes(1);
    expect(m.sitemap).toHaveBeenCalledTimes(2);
  });
  it("audits admission before fixed-endpoint bounded transport without URL/key audit leakage", async () => {
    const result = await submitIndexNowPaths("staff", "/about\n/about"); expect(result).toEqual({ state: "received", count: 1, auditRecorded: true });
    expect(Number(m.attempt.mock.invocationCallOrder[0])).toBeLessThan(Number(m.fetch.mock.invocationCallOrder[0]));
    const [url, input] = m.fetch.mock.calls[0] ?? []; expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(input).toMatchObject({ method: "POST", cache: "no-store", redirect: "error", credentials: "omit", signal: expect.any(AbortSignal) });
    expect(JSON.parse(input.body)).toEqual({ host: "amaanafoundation.org", key: "synthetic-key-1234", keyLocation: origin + "/synthetic-key-1234.txt", urlList: [origin + "/about"] });
    expect(m.attempt).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ metadata: { count: 1 } }) }));
    expect(JSON.stringify(m.outcome.mock.calls)).not.toMatch(/synthetic-key|\/about|token/);
  });
  it("fails closed when audit admission cannot commit", async () => {
    m.transaction.mockRejectedValue(new Error("Database unavailable")); await expect(submitIndexNowPaths("staff", "/about")).rejects.toThrow(); expect(m.fetch).not.toHaveBeenCalled();
  });
  it("admits no second attempt in the rolling staff window", async () => {
    m.recent.mockResolvedValue({ id: "earlier-attempt" }); expect((await submitIndexNowPaths("staff", "/about")).state).toBe("throttled");
    expect(m.fetch).not.toHaveBeenCalled(); expect(m.attempt).not.toHaveBeenCalled();
    expect(m.recent).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ actorId: "staff", createdAt: { gte: expect.any(Date) } }) }));
  });
  it.each([[200, "received"], [202, "validation_pending"], [400, "rejected"], [403, "rejected"], [422, "rejected"], [429, "rejected"], [500, "unknown"], [302, "unknown"]])("distinguishes HTTP %i as %s without claiming indexing", async (status, state) => {
    m.fetch.mockResolvedValue(new Response(null, { status })); expect((await submitIndexNowPaths("staff", "/about")).state).toBe(state); expect(m.fetch).toHaveBeenCalledTimes(1);
  });
  it("records uncertain delivery on timeout without retry or leaking provider errors", async () => {
    m.fetch.mockRejectedValue(new Error("synthetic-key-1234 private provider details")); expect(await submitIndexNowPaths("staff", "/about")).toEqual({ state: "unknown", count: 1, auditRecorded: true }); expect(m.fetch).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(m.outcome.mock.calls)).not.toContain("private provider details");
  });
  it("preserves received success when outcome auditing fails after outbound work", async () => {
    m.outcome.mockRejectedValue(new Error("Audit unavailable")); expect(await submitIndexNowPaths("staff", "/about")).toEqual({ state: "received", count: 1, auditRecorded: false }); expect(m.fetch).toHaveBeenCalledTimes(1);
  });
  it("does not wait for a stalled provider response body cancellation", async () => {
    m.fetch.mockResolvedValue({ status: 200, body: { cancel: () => new Promise(() => {}) } }); expect((await submitIndexNowPaths("staff", "/about")).state).toBe("received");
  });
});
