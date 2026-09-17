import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, verifyPasswordOrDummy } from "./password";

describe("staff passwords", () => {
  it("verifies the right password and rejects a wrong one", async () => {
    const hash = await hashPassword("a strong example password");
    expect(await verifyPassword("a strong example password", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  });

  it("rejects malformed stored hashes", async () => {
    expect(await verifyPassword("password", "invalid")).toBe(false);
  });

  it("always rejects the dummy path while still performing password verification work", async () => {
    expect(await verifyPasswordOrDummy("any supplied password", null)).toBe(false);
    expect(await verifyPasswordOrDummy("any supplied password", undefined)).toBe(false);
  });

  it("uses the real credential when one exists", async () => {
    const hash = await hashPassword("correct password");
    expect(await verifyPasswordOrDummy("correct password", hash)).toBe(true);
    expect(await verifyPasswordOrDummy("incorrect password", hash)).toBe(false);
  });
});
