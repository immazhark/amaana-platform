import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  validateProductionEnvironment: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ validateProductionEnvironment: mocks.validateProductionEnvironment }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: mocks.queryRaw } }));

import { GET } from "./route";

describe("readiness health", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);

  beforeEach(() => {
    vi.useFakeTimers();
    mocks.validateProductionEnvironment.mockReset();
    mocks.queryRaw.mockReset();
    consoleError.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it("reports ready only after environment and database checks pass", async () => {
    mocks.queryRaw.mockResolvedValue([{ "?column?": 1 }]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toMatch(/no-store/i);
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    await expect(response.json()).resolves.toEqual({ status: "ready" });
  });

  it("fails closed when production environment validation fails", async () => {
    mocks.validateProductionEnvironment.mockImplementation(() => { throw new Error("invalid environment"); });
    const response = await GET();
    expect(response.status).toBe(503);
    expect(mocks.queryRaw).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalledWith("Readiness check failed", { component: "environment" });
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain("invalid environment");
  });

  it("fails closed within a bounded interval when the database probe hangs", async () => {
    mocks.queryRaw.mockReturnValue(new Promise(() => undefined));
    const responsePromise = GET();
    await vi.advanceTimersByTimeAsync(2_500);
    const response = await responsePromise;
    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ status: "not_ready" });
    expect(consoleError).toHaveBeenCalledWith("Readiness check failed", { component: "database" });
  });
});
