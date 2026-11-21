import { randomBytes, scrypt as nodeScrypt } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, passwordNeedsRehash, verifyPassword } from "./password";

function legacyHash(password: string) {
  return new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16);
    nodeScrypt(password, salt, 64, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(`scrypt:${salt.toString("hex")}:${Buffer.from(derivedKey).toString("hex")}`);
    });
  });
}

describe("staff passwords", () => {
  it("creates a versioned strong hash and verifies the right password", async () => {
    const hash = await hashPassword("a strong example password");
    expect(hash).toMatch(/^scrypt\$131072\$8\$1\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(passwordNeedsRehash(hash)).toBe(false);
    expect(await verifyPassword("a strong example password", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  }, 30_000);

  it("keeps legacy hashes verifiable and marks them for transparent upgrade", async () => {
    const hash = await legacyHash("legacy example password");
    expect(passwordNeedsRehash(hash)).toBe(true);
    expect(await verifyPassword("legacy example password", hash)).toBe(true);
    expect(await verifyPassword("wrong password", hash)).toBe(false);
  }, 30_000);

  it("rejects malformed or missing stored hashes after running the verification path", async () => {
    expect(await verifyPassword("password", "invalid")).toBe(false);
    expect(await verifyPassword("password", "")).toBe(false);
    expect(await verifyPassword("password", "scrypt:not-hex:not-hex")).toBe(false);
  }, 30_000);

  it("AF-N11 verifies a real valid lower-work-factor scrypt digest and requires rehash", async () => {
    const password = "synthetic legacy-work-factor credential";
    const salt = Buffer.alloc(16, 0x41);
    const low = await new Promise<Buffer>((resolve, reject) => {
      nodeScrypt(password, salt, 64, { N: 1024, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }, (error, key) => {
        if (error) reject(error);
        else resolve(key);
      });
    });
    const stored = ["scrypt", 1024, 8, 1, salt.toString("hex"), low.toString("hex")].join("$");

    // Unlike malformed-field fixtures, this is an authentically derived,
    // valid legacy-cost credential that must be upgraded after verification.
    expect(passwordNeedsRehash(stored)).toBe(true);
    await expect(verifyPassword(password, stored)).resolves.toBe(true);
    await expect(verifyPassword("incorrect synthetic credential", stored)).resolves.toBe(false);
  }, 30_000);

  it("rejects attacker-controlled scrypt work factors above the application ceiling", async () => {
    const salt = "00".repeat(16);
    const hash = "00".repeat(64);

    await expect(verifyPassword("password", ["scrypt", 262144, 8, 1, salt, hash].join("$"))).resolves.toBe(false);
    await expect(verifyPassword("password", ["scrypt", 131072, 16, 1, salt, hash].join("$"))).resolves.toBe(false);
    await expect(verifyPassword("password", ["scrypt", 131072, 8, 2, salt, hash].join("$"))).resolves.toBe(false);
  }, 30_000);

});
