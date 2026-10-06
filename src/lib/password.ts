import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";

const CURRENT_SCRYPT = {
  N: 131_072,
  r: 8,
  p: 1,
  keyLength: 64,
  maxmem: 256 * 1024 * 1024,
} as const;

const DUMMY_SALT = Buffer.alloc(16);
const DUMMY_HASH = Buffer.alloc(CURRENT_SCRYPT.keyLength);

type ScryptParams = Pick<typeof CURRENT_SCRYPT, "N" | "r" | "p" | "maxmem">;

function derivePassword(
  password: string,
  salt: Buffer,
  keyLength: number,
  params?: ScryptParams,
) {
  return new Promise<Buffer>((resolve, reject) => {
    const callback = (error: Error | null, derivedKey: Buffer) => {
      if (error) reject(error);
      else resolve(derivedKey);
    };

    if (params) {
      nodeScrypt(password, salt, keyLength, params, callback);
    } else {
      // Legacy hashes used Node's default scrypt work factors. Keep this path
      // only for verification so existing administrators are not locked out.
      nodeScrypt(password, salt, keyLength, callback);
    }
  });
}

function isHex(value: string | undefined) {
  return Boolean(value && value.length % 2 === 0 && /^[0-9a-f]+$/i.test(value));
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await derivePassword(password, salt, CURRENT_SCRYPT.keyLength, CURRENT_SCRYPT);
  return [
    "scrypt",
    CURRENT_SCRYPT.N,
    CURRENT_SCRYPT.r,
    CURRENT_SCRYPT.p,
    salt.toString("hex"),
    derived.toString("hex"),
  ].join("$");
}

export function passwordNeedsRehash(stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return true;

  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts;
  return Number(nRaw) !== CURRENT_SCRYPT.N
    || Number(rRaw) !== CURRENT_SCRYPT.r
    || Number(pRaw) !== CURRENT_SCRYPT.p
    || !isHex(saltHex)
    || !isHex(hashHex)
    || Buffer.from(hashHex ?? "", "hex").length !== CURRENT_SCRYPT.keyLength;
}

export async function verifyPassword(password: string, stored: string) {
  const modern = stored.split("$");
  if (modern.length === 6 && modern[0] === "scrypt") {
    const [, nRaw, rRaw, pRaw, saltHex, hashHex] = modern;
    const N = Number(nRaw);
    const r = Number(rRaw);
    const p = Number(pRaw);
    const valid = Number.isInteger(N)
      && Number.isInteger(r)
      && Number.isInteger(p)
      && N >= 2
      && (N & (N - 1)) === 0
      && r > 0
      && p > 0
      && isHex(saltHex)
      && isHex(hashHex);

    const salt = valid ? Buffer.from(saltHex!, "hex") : DUMMY_SALT;
    const expected = valid ? Buffer.from(hashHex!, "hex") : DUMMY_HASH;

    // Refuse attacker-controlled work factors above the application's own
    // ceiling. Malformed hashes still execute the current-cost dummy path.
    const safeParams = valid
      && N <= CURRENT_SCRYPT.N
      && r <= CURRENT_SCRYPT.r
      && p <= CURRENT_SCRYPT.p
      ? { N, r, p, maxmem: CURRENT_SCRYPT.maxmem }
      : CURRENT_SCRYPT;

    const supplied = await derivePassword(password, salt, expected.length, safeParams);
    return valid
      && N <= CURRENT_SCRYPT.N
      && r <= CURRENT_SCRYPT.r
      && p <= CURRENT_SCRYPT.p
      && supplied.length === expected.length
      && timingSafeEqual(supplied, expected);
  }

  const [algorithm, saltHex, hashHex] = stored.split(":");
  const validLegacy = algorithm === "scrypt"
    && isHex(saltHex)
    && isHex(hashHex);

  if (validLegacy) {
    const salt = Buffer.from(saltHex!, "hex");
    const expected = Buffer.from(hashHex!, "hex");
    if (expected.length > 0 && expected.length <= 128) {
      const supplied = await derivePassword(password, salt, expected.length);
      return supplied.length === expected.length && timingSafeEqual(supplied, expected);
    }
  }

  const supplied = await derivePassword(password, DUMMY_SALT, DUMMY_HASH.length, CURRENT_SCRYPT);
  return supplied.length === DUMMY_HASH.length && timingSafeEqual(supplied, DUMMY_HASH) && false;
}
