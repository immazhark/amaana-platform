import "server-only";
import { createHash, createPublicKey, KeyObject, sign, verify } from "node:crypto";
import { digestSyntheticAggregateDraft } from "./aggregate-attestation-draft";

const version = "SYNTHETIC_AGGREGATE_SIGNATURE_V1";
const hexDigest = /^[a-f0-9]{64}$/;
const hexSignature = /^[a-f0-9]{128}$/;
const payloadKeys = ["schemaVersion", "aggregateDigest", "evidenceDigest", "issuedOn", "expiresOn", "signerId"] as const;

type Payload = {
  schemaVersion: typeof version;
  aggregateDigest: string;
  evidenceDigest: string;
  issuedOn: string;
  expiresOn: string;
  signerId: string;
};
type Envelope = Payload & { signature: string };
type SyntheticTrustPolicy = { signers: ReadonlyMap<string, KeyObject>; revoked: ReadonlySet<string> };

function exactRecord(raw: unknown, keys: readonly string[]): asserts raw is Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Object.getPrototypeOf(raw) !== Object.prototype ||
      Reflect.ownKeys(raw).length !== keys.length || !keys.every(key => {
        const descriptor = Object.getOwnPropertyDescriptor(raw, key);
        return descriptor?.enumerable === true && Object.hasOwn(descriptor, "value");
      })) throw new Error("Invalid synthetic attestation record");
}
function digest(value: unknown): string {
  if (typeof value !== "string" || !hexDigest.test(value)) throw new Error("Invalid evidence or aggregate digest");
  return value;
}
function day(value: unknown): string {
  if (typeof value !== "string" || !/^20\d{2}-\d{2}-\d{2}$/.test(value)) throw new Error("Invalid attestation date");
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error("Invalid attestation date");
  return value;
}
function assertKey(key: unknown, type: "public" | "private"): asserts key is KeyObject {
  if (!(key instanceof KeyObject) || key.type !== type || key.asymmetricKeyType !== "ed25519") throw new Error("Expected an Ed25519 key");
}
export function syntheticSignerId(publicKey: KeyObject): string {
  assertKey(publicKey, "public");
  return createHash("sha256").update("AMAANA:SYNTHETIC_SIGNER_V1\0").update(publicKey.export({ type: "spki", format: "der" })).digest("hex");
}
function makePayload(raw: unknown, evidence: unknown, dates: unknown, signerId: unknown): Payload {
  exactRecord(dates, ["issuedOn", "expiresOn"]);
  const issuedOn = day(dates.issuedOn);
  const expiresOn = day(dates.expiresOn);
  if (issuedOn >= expiresOn) throw new Error("Invalid attestation validity interval");
  return { schemaVersion: version, aggregateDigest: digestSyntheticAggregateDraft(raw).digestHex, evidenceDigest: digest(evidence), issuedOn, expiresOn, signerId: digest(signerId) };
}
const signedBytes = (payload: Payload) => Buffer.from("AMAANA:PRIVATE_SYNTHETIC_ATTESTATION_V1\0" + JSON.stringify(payload), "utf8");
const attestationId = (bytes: Buffer) => createHash("sha256").update("AMAANA:SYNTHETIC_ATTESTATION_ID_V1\0").update(bytes).digest("hex");

/** Offline synthetic-only proof. Keys must be supplied in memory; no key loading, persistence, or publication. */
export function signSyntheticAggregate(raw: unknown, evidence: unknown, dates: unknown, privateKey: KeyObject): Envelope {
  assertKey(privateKey, "private");
  const payload = makePayload(raw, evidence, dates, syntheticSignerId(createPublicKey(privateKey)));
  return { ...payload, signature: sign(null, signedBytes(payload), privateKey).toString("hex") };
}

/** The independent verifier must provide the expected evidence digest and current trusted/revoked synthetic IDs.
 * A valid signature proves byte integrity for the supplied key, not factual accuracy, signer authority, or public approval. */
export function verifySyntheticAggregate(raw: unknown, envelope: unknown, expectedEvidence: unknown, policy: SyntheticTrustPolicy, now: Date) {
  exactRecord(envelope, [...payloadKeys, "signature"]);
  if (envelope.schemaVersion !== version || typeof envelope.signature !== "string" || !hexSignature.test(envelope.signature)) throw new Error("Invalid synthetic signature envelope");
  const payload = makePayload(raw, expectedEvidence, { issuedOn: envelope.issuedOn, expiresOn: envelope.expiresOn }, envelope.signerId);
  if (envelope.aggregateDigest !== payload.aggregateDigest || envelope.evidenceDigest !== payload.evidenceDigest) throw new Error("Synthetic evidence does not match signed aggregate");
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error("Invalid verification time");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (today < payload.issuedOn || today >= payload.expiresOn) throw new Error("Synthetic attestation outside validity interval");
  if (!(policy?.signers instanceof Map) || !(policy.revoked instanceof Set)) throw new Error("Explicit synthetic trust and revocation policy required");
  const key = policy.signers.get(payload.signerId);
  assertKey(key, "public");
  if (syntheticSignerId(key) !== payload.signerId) throw new Error("Synthetic signer does not match trusted key");
  const bytes = signedBytes(payload);
  const id = attestationId(bytes);
  if (policy.revoked.has(id) || policy.revoked.has(payload.signerId)) throw new Error("Synthetic attestation or signer revoked");
  if (!verify(null, bytes, key, Buffer.from(envelope.signature, "hex"))) throw new Error("Synthetic signature does not match");
  return { status: "SYNTHETIC_SIGNATURE_VALID_NOT_PUBLIC" as const, attestationId: id };
}
