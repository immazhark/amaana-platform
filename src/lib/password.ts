import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const DUMMY_SALT = Buffer.alloc(16);
const DUMMY_HASH = Buffer.alloc(64);

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return `scrypt:${salt.toString("hex")}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algorithm, saltHex, hashHex] = stored.split(":");
  const validStoredHash = algorithm === "scrypt"
    && Boolean(saltHex)
    && Boolean(hashHex)
    && /^[0-9a-f]+$/i.test(saltHex ?? "")
    && /^[0-9a-f]+$/i.test(hashHex ?? "");

  const salt = validStoredHash ? Buffer.from(saltHex, "hex") : DUMMY_SALT;
  const expected = validStoredHash ? Buffer.from(hashHex, "hex") : DUMMY_HASH;
  const supplied = await scrypt(password, salt, expected.length) as Buffer;

  return validStoredHash
    && supplied.length === expected.length
    && timingSafeEqual(supplied, expected);
}
