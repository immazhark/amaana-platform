import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  isEmailDeliveryEnabled: vi.fn(),
  processPendingEmailNotifications: vi.fn(),
  pruneEphemeralSecurityLedgers: vi.fn(),
}));

vi.mock("@/lib/env", () => ({
  isEmailDeliveryEnabled: mocks.isEmailDeliveryEnabled,
}));
vi.mock("@/lib/notifications", () => ({
  processPendingEmailNotifications: mocks.processPendingEmailNotifications,
}));
vi.mock("@/lib/security-ledger-retention", () => ({
  pruneEphemeralSecurityLedgers: mocks.pruneEphemeralSecurityLedgers,
}));

import { POST } from "./route";

const originalSecret = process.env.CRON_SECRET;

function request(secret = "s".repeat(32)) {
  return new Request("https://amaanafoundation.org/api/jobs/notifications", {
    method: "POST",
    headers: { authorization: `Bearer ${secret}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.CRON_SECRET = "s".repeat(32);
  mocks.pruneEphemeralSecurityLedgers.mockResolvedValue({
    rateLimitAttemptsDeleted: 2,
    loginAttemptsDeleted: 1,
  });
  mocks.processPendingEmailNotifications.mockResolvedValue({
    selected: 1,
    sent: 1,
    failed: 0,
  });
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.CRON_SECRET;
  else process.env.CRON_SECRET = originalSecret;
});

describe("notification maintenance job", () => {
  it("rejects unauthorized callers before running maintenance or delivery", async () => {
    const response = await POST(request("x".repeat(32)));
    expect(response.status).toBe(401);
    expect(mocks.pruneEphemeralSecurityLedgers).not.toHaveBeenCalled();
    expect(mocks.processPendingEmailNotifications).not.toHaveBeenCalled();
  });

  it("keeps unauthorized job responses private and non-indexable", async () => {
    const response = await POST(request("x".repeat(32)));

    expect(response.headers.get("cache-control")).toMatch(/no-store.*private/i);
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("x-robots-tag")).toMatch(/noindex.*nofollow.*noarchive/i);
  });

  it("runs retention maintenance while email delivery is disabled", async () => {
    mocks.isEmailDeliveryEnabled.mockReturnValue(false);
    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "disabled",
      retention: {
        status: "ok",
        rateLimitAttemptsDeleted: 2,
        loginAttemptsDeleted: 1,
      },
    });
    expect(mocks.processPendingEmailNotifications).not.toHaveBeenCalled();
  });

  it("does not let retention cleanup failure block live email processing", async () => {
    mocks.isEmailDeliveryEnabled.mockReturnValue(true);
    mocks.pruneEphemeralSecurityLedgers.mockRejectedValue(new Error("cleanup failed"));

    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      selected: 1,
      sent: 1,
      failed: 0,
      retention: { status: "failed" },
    });
    expect(mocks.processPendingEmailNotifications).toHaveBeenCalledTimes(1);
  });

  it("reports delivery failure independently of successful retention maintenance", async () => {
    mocks.isEmailDeliveryEnabled.mockReturnValue(true);
    mocks.processPendingEmailNotifications.mockRejectedValue(new Error("provider unavailable"));

    const response = await POST(request());
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      status: "failed",
      retention: {
        status: "ok",
        rateLimitAttemptsDeleted: 2,
        loginAttemptsDeleted: 1,
      },
    });
  });
});
