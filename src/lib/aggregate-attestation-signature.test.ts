import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { it } from "vitest";
import { signSyntheticAggregate, verifySyntheticAggregate, syntheticSignerId } from "./aggregate-attestation-signature";

const draft = { schemaVersion: "SYNTHETIC_AGGREGATE_DRAFT_V1", periodStart: "2026-01-01", periodEnd: "2026-01-31", metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count: 3 }] };
const evidence = "a".repeat(64);
const dates = { issuedOn: "2026-02-01", expiresOn: "2026-03-01" };
const now = new Date("2026-02-02T00:00:00Z");
function fixture() {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const envelope = signSyntheticAggregate(draft, evidence, dates, privateKey);
  const policy = { signers: new Map([[syntheticSignerId(publicKey), publicKey]]), revoked: new Set<string>() };
  return { envelope, policy, privateKey, publicKey };
}

it("verifies a signed synthetic aggregate against independently supplied evidence and trust", () => {
  const { envelope, policy } = fixture();
  const result = verifySyntheticAggregate(draft, envelope, evidence, policy, now);
  assert.equal(result.status, "SYNTHETIC_SIGNATURE_VALID_NOT_PUBLIC");
  assert.match(result.attestationId, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(envelope), /PRIVATE KEY|donor|publicUrl/);
});
it("rejects modified aggregate, provenance digest, expiry, signature and unknown fields", () => {
  const { envelope, policy } = fixture();
  assert.throws(() => verifySyntheticAggregate({ ...draft, metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count: 4 }] }, envelope, evidence, policy, now));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, "b".repeat(64), policy, now));
  for (const patch of [{ evidenceDigest: "b".repeat(64) }, { expiresOn: "2026-03-02" }, { signature: "0".repeat(128) }, { signature: envelope.signature.toUpperCase() }, { donorName: "synthetic" }]) {
    assert.throws(() => verifySyntheticAggregate(draft, { ...envelope, ...patch }, evidence, policy, now));
  }
});
it("rejects untrusted or substituted keys, including a different key stored under a trusted ID", () => {
  const { envelope, policy } = fixture();
  const other = generateKeyPairSync("ed25519").publicKey;
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, { ...policy, signers: new Map() }, now));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, { ...policy, signers: new Map([[envelope.signerId, other]]) }, now));
});
it("requires an explicit revocation set and rejects a revoked attestation", () => {
  const { envelope, policy } = fixture();
  const id = verifySyntheticAggregate(draft, envelope, evidence, policy, now).attestationId;
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, { ...policy, revoked: new Set([id]) }, now));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, { ...policy, revoked: new Set([envelope.signerId]) }, now));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, { signers: policy.signers } as typeof policy, now));
});
it("enforces inclusive issue and exclusive expiry at IST calendar-day boundaries", () => {
  const { envelope, policy } = fixture();
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, policy, new Date("2026-01-31T18:29:59Z")));
  assert.doesNotThrow(() => verifySyntheticAggregate(draft, envelope, evidence, policy, new Date("2026-01-31T18:30:00Z")));
  assert.doesNotThrow(() => verifySyntheticAggregate(draft, envelope, evidence, policy, new Date("2026-02-28T18:29:59Z")));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, policy, new Date("2026-02-28T18:30:00Z")));
  assert.throws(() => verifySyntheticAggregate(draft, envelope, evidence, policy, new Date(NaN)));
});
it("refuses non-synthetic metrics, invalid dates, private fields and unsupported signing keys", () => {
  const { privateKey } = fixture();
  assert.throws(() => signSyntheticAggregate({ ...draft, metrics: [{ code: "REAL_DONOR_COUNT", count: 1 }] }, evidence, dates, privateKey));
  assert.throws(() => signSyntheticAggregate({ ...draft, donorEmail: "synthetic@example.invalid" }, evidence, dates, privateKey));
  assert.throws(() => signSyntheticAggregate(draft, evidence, { ...dates, issuedOn: "2026-02-30" }, privateKey));
  assert.throws(() => signSyntheticAggregate(draft, evidence, { ...dates, expiresOn: dates.issuedOn }, privateKey));
  assert.throws(() => signSyntheticAggregate(draft, evidence, dates, generateKeyPairSync("ec", { namedCurve: "P-256" }).privateKey));
});
it("rejects accessor properties without reading them", () => {
  const { envelope, policy } = fixture();
  let reads = 0;
  const altered = Object.defineProperty({ ...envelope }, "signature", { enumerable: true, get() { reads++; return envelope.signature; } });
  assert.throws(() => verifySyntheticAggregate(draft, altered, evidence, policy, now));
  assert.equal(reads, 0);
});
