import { describe, expect, it } from "vitest";
import {
  LOGIN_ATTEMPT_RETENTION_MS,
  RATE_LIMIT_LEDGER_RETENTION_MS,
  ephemeralSecurityLedgerCutoffs,
} from "./security-ledger-retention";

describe("ephemeral security ledger retention", () => {
  it("keeps rate-limit attempts far beyond the active one-hour enforcement window", () => {
    expect(RATE_LIMIT_LEDGER_RETENTION_MS).toBe(24 * 60 * 60 * 1000);
  });

  it("keeps login-attempt hashes for seven days, well beyond the 15-minute lockout window", () => {
    expect(LOGIN_ATTEMPT_RETENTION_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("derives deterministic cutoffs from the maintenance time", () => {
    const now = new Date("2026-09-18T04:00:00.000Z");
    const cutoffs = ephemeralSecurityLedgerCutoffs(now);
    expect(cutoffs.rateLimitBefore.toISOString()).toBe("2026-09-17T04:00:00.000Z");
    expect(cutoffs.loginBefore.toISOString()).toBe("2026-09-11T04:00:00.000Z");
  });
});
