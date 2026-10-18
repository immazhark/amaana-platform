import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  prune: vi.fn(),
  processNotifications: vi.fn(),
  deliveryEnabled: vi.fn(),
}));

vi.mock("@/lib/security-ledger-retention", () => ({
  pruneEphemeralSecurityLedgers: mocks.prune,
}));
vi.mock("@/lib/notifications", () => ({
  processPendingEmailNotifications: mocks.processNotifications,
}));
vi.mock("@/lib/env", () => ({
  isEmailDeliveryEnabled: mocks.deliveryEnabled,
}));

import { POST } from "./route";

const originalSecret = process.env.CRON_SECRET;
function request(token: string | null = "s".repeat(32)) {
  const headers = token === null ? {} : { authorization: `Bearer ${token}` };
  return new Request("https://amaanafoundation.org/api/jobs/retention", { method: "POST", headers });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "s".repeat(32);
  mocks.prune.mockResolvedValue({
    rateLimitAttemptsDeleted: 4,
    loginAttemptsDeleted: 2,
    webVitalsAggregatesDeleted: 3,
  });
});
afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("isolated security-ledger retention job", () => {
  it.each([
    ["absent", null],
    ["mismatch", "x".repeat(32)],
    ["short", "s"],
    ["equal-length but wrong UTF-8 bytes", "s".repeat(31) + "é"],
    ["oversized", "s".repeat(10_000)],
  ])("rejects %s authorization before reading or deleting records", async (_name, credential) => {
    const response = await POST(request(credential));
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(mocks.prune).not.toHaveBeenCalled();
    expect(mocks.processNotifications).not.toHaveBeenCalled();
  });

  it("cannot run if the shared secret is unconfigured", async () => {
    delete process.env.CRON_SECRET;
    const response = await POST(request());
    expect(response.status).toBe(401);
    expect(mocks.prune).not.toHaveBeenCalled();
  });

  it("prunes only ephemeral security ledgers and never sends mail even if email delivery is enabled", async () => {
    mocks.deliveryEnabled.mockReturnValue(true);
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      status: "ok",
      rateLimitAttemptsDeleted: 4,
      loginAttemptsDeleted: 2,
      webVitalsAggregatesDeleted: 3,
    });
    expect(mocks.prune).toHaveBeenCalledOnce();
    expect(mocks.processNotifications).not.toHaveBeenCalled();
    expect(mocks.deliveryEnabled).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
  });

  it("preserves authenticated Unicode token comparison without accepting visually similar bytes", async () => {
    process.env.CRON_SECRET = "é".repeat(32);
    const response = await POST(request("é".repeat(32)));
    expect(response.status).toBe(200);
    expect(mocks.prune).toHaveBeenCalledOnce();
    expect(mocks.processNotifications).not.toHaveBeenCalled();
  });

  it("fails closed without leaking DB errors or sending mail when pruning fails", async () => {
    mocks.prune.mockRejectedValueOnce(new Error("synthetic private SQL diagnostic"));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(await response.json()).toEqual({ status: "failed" });
    expect(mocks.processNotifications).not.toHaveBeenCalled();
  });
});
