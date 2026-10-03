import { describe, expect, it } from "vitest";
import {
  AUTH_FAILURE_LIMIT,
  AUTH_FAILURE_WINDOW_MS,
  authFailureWindowStart,
  isAuthFailureCountLocked,
} from "./auth-rate-limit";

describe("admin authentication rate-limit policy", () => {
  it("locks at the configured failure threshold", () => {
    expect(isAuthFailureCountLocked(AUTH_FAILURE_LIMIT - 1)).toBe(false);
    expect(isAuthFailureCountLocked(AUTH_FAILURE_LIMIT)).toBe(true);
    expect(isAuthFailureCountLocked(AUTH_FAILURE_LIMIT + 1)).toBe(true);
  });

  it("uses a 15-minute rolling failure window", () => {
    const now = new Date("2026-09-17T04:15:00.000Z");
    expect(authFailureWindowStart(now).getTime()).toBe(now.getTime() - AUTH_FAILURE_WINDOW_MS);
    expect(AUTH_FAILURE_WINDOW_MS).toBe(15 * 60 * 1000);
  });
});
