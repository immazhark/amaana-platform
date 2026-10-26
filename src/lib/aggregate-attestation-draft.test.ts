import { describe, expect, it } from "vitest";
import { digestSyntheticAggregateDraft } from "./aggregate-attestation-draft";

const draft = {
  schemaVersion: "SYNTHETIC_AGGREGATE_DRAFT_V1",
  periodStart: "2026-01-01",
  periodEnd: "2026-01-31",
  metrics: [
    { code: "SYNTHETIC_ACTIVITY_COUNT", count: 3 },
    { code: "SYNTHETIC_DISTRIBUTION_COUNT", count: 5 },
  ],
};

describe("unverified, private aggregate digest draft", () => {
  it("canonicalizes metric ordering without changing bytes or digest", () => {
    const a = digestSyntheticAggregateDraft(draft);
    const b = digestSyntheticAggregateDraft({ ...draft, metrics: [...draft.metrics].reverse() });
    expect(a).toEqual(b);
    expect(a.algorithm).toBe("SHA-256");
    expect(a.status).toBe("SYNTHETIC_UNVERIFIED_NOT_PUBLIC");
    expect(a.digestHex).toMatch(/^[a-f0-9]{64}$/);
    expect(a.canonicalJson).not.toContain("donor");
  });

  it("changes digest on a count or period change", () => {
    const baseline = digestSyntheticAggregateDraft(draft).digestHex;
    expect(digestSyntheticAggregateDraft({
      ...draft, metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count: 4 }, draft.metrics[1]],
    }).digestHex).not.toBe(baseline);
    expect(digestSyntheticAggregateDraft({ ...draft, periodEnd: "2026-02-01" }).digestHex).not.toBe(baseline);
  });

  it("refuses personal identifiers and arbitrary top-level or metric properties", () => {
    for (const input of [
      { ...draft, donorEmail: "synthetic@example.invalid" },
      { ...draft, metrics: [{ ...draft.metrics[0], name: "Private person" }] },
      { ...draft, metrics: [{ code: "DONOR_AADHAAR", count: 1 }] },
      { ...draft, metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count: 1, phone: "000" }] },
    ]) expect(() => digestSyntheticAggregateDraft(input)).toThrow();
  });

  it("rejects duplicate metric codes, not just repeated values", () => {
    expect(() => digestSyntheticAggregateDraft({
      ...draft, metrics: [draft.metrics[0], { ...draft.metrics[0], count: 7 }],
    })).toThrow(/duplicate/i);
  });

  it("rejects invalid dates, reversed periods and malformed version", () => {
    for (const input of [
      { ...draft, periodStart: "2026-02-30" },
      { ...draft, periodStart: "2026-02-01" },
      { ...draft, periodEnd: "2026-01-00" },
      { ...draft, schemaVersion: "PUBLIC_VERIFIED_V1" },
    ]) expect(() => digestSyntheticAggregateDraft(input)).toThrow();
  });

  it("rejects unsafe, negative, fractional, string and nonfinite counts", () => {
    for (const count of [-1, 0.5, "3", Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => digestSyntheticAggregateDraft({
        ...draft, metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count }],
      })).toThrow();
    }
  });

  it("rejects missing, empty or oversized metric arrays", () => {
    const sparse = Array(2);
    sparse[1] = draft.metrics[0];
    for (const metrics of [undefined, [], Array(1), sparse, Array(100).fill(draft.metrics[0])]) {
      expect(() => digestSyntheticAggregateDraft({ ...draft, metrics })).toThrow();
    }
  });

  it("rejects negative zero, symbol keys and invisible extra properties", () => {
    expect(() => digestSyntheticAggregateDraft({
      ...draft, metrics: [{ code: "SYNTHETIC_ACTIVITY_COUNT", count: -0 }],
    })).toThrow();
    const extra = { ...draft } as Record<string | symbol, unknown>;
    Object.defineProperty(extra, "privateMetadata", { value: "hidden", enumerable: false });
    expect(() => digestSyntheticAggregateDraft(extra)).toThrow();
    const withSymbol = { ...draft } as Record<string | symbol, unknown>;
    withSymbol[Symbol("private")] = "do not digest";
    expect(() => digestSyntheticAggregateDraft(withSymbol)).toThrow();
  });

  it("uses a separate digest domain from bare JSON and never signs or publishes", async () => {
    const { createHash } = await import("node:crypto");
    const result = digestSyntheticAggregateDraft(draft);
    const naive = createHash("sha256").update(result.canonicalJson).digest("hex");
    expect(result.digestHex).not.toBe(naive);
    expect(result).not.toHaveProperty("signature");
    expect(result).not.toHaveProperty("verifiedAt");
    expect(result).not.toHaveProperty("publicUrl");
  });
});
