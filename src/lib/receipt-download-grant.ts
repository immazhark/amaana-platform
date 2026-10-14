import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Short-lived private PDF capability. Never put this token into URLs, cookies,
 * analytics, HTML or logs. The issuer must first verify the original receipt
 * token; the consumer must RE-VERIFY it using the same private read projection.
 * This is replayable for five minutes, not a one-time credential.
 */
const PREFIX = "rd1";
const PURPOSE = "amaana:private-receipt-pdf:v1";
const TTL_MS = 5 * 60 * 1000;
const MAX_CLOCK_SKEW_MS = 30_000;
const MAX_GRANT_LENGTH = 1400;
const REF_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{20,300}$/;

type Payload = {
  version: 1;
  purpose: "receipt-pdf";
  reference: string;
  token: string;
  issuedAt: number;
  expiresAt: number;
};

function keyFromEnvironment(): Buffer {
  const configured = process.env.RECEIPT_DOWNLOAD_ENCRYPTION_KEY;
  if (!configured || !/^[0-9a-fA-F]{64}$/.test(configured)) {
    throw new Error("Private receipt download signing key is not configured");
  }
  return Buffer.from(configured, "hex");
}

function validReferenceToken(reference: unknown, token: unknown): boolean {
  return typeof reference === "string" && REF_PATTERN.test(reference)
    && typeof token === "string" && TOKEN_PATTERN.test(token);
}

/** Issue only AFTER an existing private receipt credential has been validated. */
export function createReceiptDownloadGrant(input: {
  reference: string;
  token: string;
}, now = Date.now()): string {
  if (!validReferenceToken(input.reference, input.token)
    || !Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(now + TTL_MS)) {
    throw new Error("Invalid private receipt grant request");
  }
  const data: Payload = {
    version: 1, purpose: "receipt-pdf",
    reference: input.reference, token: input.token,
    issuedAt: now, expiresAt: now + TTL_MS,
  };
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromEnvironment(), nonce);
  cipher.setAAD(Buffer.from(PURPOSE, "utf8"));
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(data), "utf8"), cipher.final()]);
  return [PREFIX, nonce.toString("base64url"), ciphertext.toString("base64url"),
    cipher.getAuthTag().toString("base64url")].join(".");
}

function decodeCanonical(input: string, maxBytes: number): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(input) || input.length > Math.ceil(maxBytes * 4 / 3) + 3) return null;
  const buffer = Buffer.from(input, "base64url");
  return buffer.length <= maxBytes && buffer.toString("base64url") === input ? buffer : null;
}

/** No private token, reference or reason escapes on invalid or expired grants. */
export function openReceiptDownloadGrant(grant: unknown, now = Date.now()): {
  reference: string;
  token: string;
} | null {
  if (typeof grant !== "string" || grant.length > MAX_GRANT_LENGTH ||
      !Number.isSafeInteger(now) || now < 0) return null;
  const parts = grant.split(".");
  if (parts.length !== 4 || parts[0] !== PREFIX) return null;
  const nonce = decodeCanonical(parts[1]!, 12);
  const ciphertext = decodeCanonical(parts[2]!, 1024);
  const tag = decodeCanonical(parts[3]!, 16);
  if (!nonce || nonce.length !== 12 || !ciphertext || !tag || tag.length !== 16) return null;

  // Never substitute a development fallback key if production is unconfigured.
  const key = keyFromEnvironment();
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    decipher.setAAD(Buffer.from(PURPOSE, "utf8"));
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    const parsed: unknown = JSON.parse(plaintext.toString("utf8"));
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const value = parsed as Record<string, unknown>;
    if (value.version !== 1 || value.purpose !== "receipt-pdf" ||
        !validReferenceToken(value.reference, value.token) ||
        typeof value.issuedAt !== "number" || typeof value.expiresAt !== "number" ||
        !Number.isSafeInteger(value.issuedAt) || !Number.isSafeInteger(value.expiresAt) ||
        value.expiresAt - value.issuedAt !== TTL_MS ||
        value.issuedAt > now + MAX_CLOCK_SKEW_MS ||
        value.expiresAt <= now) return null;
    return { reference: value.reference as string, token: value.token as string };
  } catch {
    return null;
  }
}

export const RECEIPT_DOWNLOAD_GRANT_TTL_SECONDS = TTL_MS / 1000;
