import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const DUMMY_PASSWORD_HASH = `scrypt:616d61616e612d6c6f67696e2d64756d6d79:${"0".repeat(128)}`;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltHex, hashHex] = stored.split(":");
  if (algorithm !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const supplied = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

/**
 * Performs the same scrypt work whether or not an account has a credential.
 * This reduces the account-existence timing signal on the admin login boundary.
 */
export async function verifyPasswordOrDummy(password: string, stored?: string | null) {
  if (stored) return verifyPassword(password, stored);
  await verifyPassword(password, DUMMY_PASSWORD_HASH);
  return false;
}
