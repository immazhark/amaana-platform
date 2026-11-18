import { describe, expect, it } from "vitest";
import { GIVING_STREAMS, allowedIntents, isIntentAllowed, streamLabel, summariseLedger, zakatNotice, zakatPolicy } from "./giving-streams";

describe("Zakat rules per stream", () => {
  it("lets general giving choose General, Sadaqah or Zakat", () => {
    expect(allowedIntents("GENERAL")).toEqual(["GENERAL", "SADAQAH", "ZAKAT"]);
  });
  it("never accepts Zakat for Eid kits, Qurbani meat or dates, and shows a visible notice", () => {
    for (const stream of ["EID_KITS", "QURBANI", "DATES"] as const) {
      expect(zakatPolicy(stream)).toBe("NOT_ACCEPTED");
      expect(isIntentAllowed(stream, "ZAKAT")).toBe(false);
      expect(isIntentAllowed(stream, "SADAQAH")).toBe(true);
      expect(zakatNotice(stream)).toMatch(/Zakat is not accepted/);
    }
  });
  it("follows the appeal's own Zakat eligibility, fixed when the appeal is published", () => {
    expect(isIntentAllowed("APPEAL", "ZAKAT", { appealZakatEligible: true })).toBe(true);
    expect(isIntentAllowed("APPEAL", "ZAKAT", { appealZakatEligible: false })).toBe(false);
    expect(isIntentAllowed("APPEAL", "ZAKAT")).toBe(false);
  });
  it("treats education sponsorship and Madarsa operations as non-Zakat until the owner rules", () => {
    for (const stream of ["EDU_SPONSORSHIP", "MADARSA_OPS"] as const) {
      expect(zakatPolicy(stream)).toBe("PENDING_OWNER_RULING");
      expect(isIntentAllowed(stream, "ZAKAT")).toBe(false);
    }
  });
  it("rejects unknown intents and labels every stream", () => {
    expect(isIntentAllowed("GENERAL", "zakat")).toBe(false);
    expect(isIntentAllowed("GENERAL", "")).toBe(false);
    expect(GIVING_STREAMS.every(stream => streamLabel(stream) !== stream)).toBe(true);
  });
});

describe("funds ledger", () => {
  const row = (stream: string, givingIntent: string, status: string, amountPaise: number, refundedPaise = 0) => ({ stream, givingIntent, status, amountPaise, refundedPaise });
  it("keeps the total Zakat account across every stream, net of refunds, excluding unverified money", () => {
    const { zakat, byStream } = summariseLedger([
      row("GENERAL", "ZAKAT", "CAPTURED", 500_000),
      row("GENERAL", "ZAKAT", "CAPTURED", 200_000, 50_000),
      row("APPEAL", "ZAKAT", "CAPTURED", 100_000),
      row("GENERAL", "ZAKAT", "PENDING_VERIFICATION", 300_000),
      row("GENERAL", "ZAKAT", "FAILED", 900_000),
      row("GENERAL", "SADAQAH", "CAPTURED", 700_000),
      row("EID_KITS", "GENERAL", "CAPTURED", 150_000),
    ]);
    expect(zakat).toEqual({ receivedPaise: 750_000, pendingVerificationPaise: 300_000, refundedPaise: 50_000 });
    expect(byStream.GENERAL?.receivedPaise).toBe(1_350_000);
    expect(byStream.EID_KITS?.receivedPaise).toBe(150_000);
  });
  it("counts a fully refunded donation as zero received", () => {
    expect(summariseLedger([row("GENERAL", "ZAKAT", "REFUNDED", 100_000, 100_000)]).zakat.receivedPaise).toBe(0);
  });
});
