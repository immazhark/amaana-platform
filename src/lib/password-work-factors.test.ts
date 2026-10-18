import { beforeEach, describe, expect, it, vi } from "vitest";

const cryptoCalls = vi.hoisted(() => ({ scrypt: vi.fn() }));
vi.mock("node:crypto", async importOriginal => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  cryptoCalls.scrypt.mockImplementation(actual.scrypt);
  return { ...actual, scrypt: cryptoCalls.scrypt };
});

import { passwordNeedsRehash, verifyPassword } from "./password";

describe("modern password work-factor ceilings", () => {
  beforeEach(() => {
    cryptoCalls.scrypt.mockClear();
  });

  it.each([
    ["short salt", "01".repeat(15), "02".repeat(64)],
    ["short hash", "01".repeat(16), "02".repeat(32)],
    ["oversized hash", "01".repeat(16), "02".repeat(256)],
    ["oversized salt", "01".repeat(256), "02".repeat(64)],
  ])("rejects malformed modern credential lengths without allocating attacker-sized derived keys: %s", async (_name, salt, hash) => {
    // Intentionally use a cheap crypto fake: this tests the parameters we send
    // to Node, not Node's own scrypt implementation.
    cryptoCalls.scrypt.mockImplementationOnce((
      _password: string,
      _salt: Buffer,
      keyLength: number,
      _params: object,
      callback: (error: Error | null, derived: Buffer) => void,
    ) => callback(null, Buffer.alloc(keyLength)));

    const stored = ["scrypt", 131072, 8, 1, salt, hash].join("$");

    expect(passwordNeedsRehash(stored)).toBe(true);
    await expect(verifyPassword("synthetic-password", stored)).resolves.toBe(false);
    expect(cryptoCalls.scrypt).toHaveBeenCalledOnce();
    expect(cryptoCalls.scrypt).toHaveBeenCalledWith(
      "synthetic-password",
      Buffer.alloc(16),
      64,
      expect.objectContaining({ N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }),
      expect.any(Function),
    );
  });

  it.each([
    ["short legacy salt", "ab".repeat(8), "cd".repeat(64)],
    ["oversized legacy salt", "ab".repeat(256), "cd".repeat(64)],
    ["short legacy digest", "ab".repeat(16), "cd".repeat(32)],
    ["oversized legacy digest", "ab".repeat(16), "cd".repeat(128)],
  ])("rejects malformed legacy credential sizes without attacker-sized crypto inputs: %s", async (_case, salt, hash) => {
    cryptoCalls.scrypt.mockImplementationOnce((
      _password: string,
      _salt: Buffer,
      keyLength: number,
      _options: object,
      callback: (error: Error | null, derived: Buffer) => void,
    ) => callback(null, Buffer.alloc(keyLength)));

    await expect(verifyPassword("synthetic-password", ["scrypt", salt, hash].join(":"))).resolves.toBe(false);
    expect(cryptoCalls.scrypt).toHaveBeenCalledOnce();
    expect(cryptoCalls.scrypt).toHaveBeenCalledWith(
      "synthetic-password",
      Buffer.alloc(16),
      64,
      expect.objectContaining({ N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }),
      expect.any(Function),
    );
  });

  it.each([
    { N: 262144, r: 8, p: 1 },
    { N: 131072, r: 16, p: 1 },
    { N: 131072, r: 8, p: 2 },
  ])("never passes over-ceiling factors to crypto: %j", async ({ N, r, p }) => {
    const salt = "01".repeat(16);
    const hash = "02".repeat(64);
    const stored = ["scrypt", N, r, p, salt, hash].join("$");

    await expect(verifyPassword("synthetic-password", stored)).resolves.toBe(false);

    expect(cryptoCalls.scrypt).toHaveBeenCalledOnce();
    expect(cryptoCalls.scrypt).toHaveBeenCalledWith(
      "synthetic-password",
      Buffer.from(salt, "hex"),
      64,
      expect.objectContaining({ N: 131072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 }),
      expect.any(Function),
    );
  }, 30_000);
});
