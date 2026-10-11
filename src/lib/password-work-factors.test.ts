import { beforeEach, describe, expect, it, vi } from "vitest";

const cryptoCalls = vi.hoisted(() => ({ scrypt: vi.fn() }));
vi.mock("node:crypto", async importOriginal => {
  const actual = await importOriginal<typeof import("node:crypto")>();
  cryptoCalls.scrypt.mockImplementation(actual.scrypt);
  return { ...actual, scrypt: cryptoCalls.scrypt };
});

import { verifyPassword } from "./password";

describe("modern password work-factor ceilings", () => {
  beforeEach(() => {
    cryptoCalls.scrypt.mockClear();
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
