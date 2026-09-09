import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("staff passwords", () => { it("verifies the right password and rejects a wrong one", async () => { const hash = await hashPassword("a strong example password"); expect(await verifyPassword("a strong example password", hash)).toBe(true); expect(await verifyPassword("wrong password", hash)).toBe(false); }); it("rejects malformed stored hashes", async () => expect(await verifyPassword("password", "invalid")).toBe(false)); });
