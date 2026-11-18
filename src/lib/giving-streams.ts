// Giving streams share one bank account; accounting and Zakat rules are kept per stream.
export const GIVING_STREAMS = ["GENERAL", "APPEAL", "EID_KITS", "QURBANI", "DATES", "EDU_SPONSORSHIP", "MADARSA_OPS"] as const;
export type GivingStreamId = (typeof GIVING_STREAMS)[number];
export type GivingIntentId = "GENERAL" | "SADAQAH" | "ZAKAT";

const LABELS: Record<GivingStreamId, string> = {
  GENERAL: "General giving",
  APPEAL: "Appeal",
  EID_KITS: "Eid kits",
  QURBANI: "Eid al-Adha meat distribution",
  DATES: "Dates distribution",
  EDU_SPONSORSHIP: "Islamic education sponsorship",
  MADARSA_OPS: "Madarsa operations",
};

export function streamLabel(stream: string): string {
  return (LABELS as Record<string, string>)[stream] ?? stream;
}

// CHOOSABLE: donor picks General, Sadaqah or Zakat. PER_APPEAL: set when the appeal is published.
// NOT_ACCEPTED: Zakat is refused. PENDING_OWNER_RULING: treated as NOT_ACCEPTED until the owner decides.
export type ZakatPolicy = "CHOOSABLE" | "PER_APPEAL" | "NOT_ACCEPTED" | "PENDING_OWNER_RULING";

const ZAKAT_POLICY: Record<GivingStreamId, ZakatPolicy> = {
  GENERAL: "CHOOSABLE",
  APPEAL: "PER_APPEAL",
  EID_KITS: "NOT_ACCEPTED",
  QURBANI: "NOT_ACCEPTED",
  DATES: "NOT_ACCEPTED",
  EDU_SPONSORSHIP: "PENDING_OWNER_RULING",
  MADARSA_OPS: "PENDING_OWNER_RULING",
};

export function zakatPolicy(stream: GivingStreamId): ZakatPolicy {
  return ZAKAT_POLICY[stream];
}

export function allowedIntents(stream: GivingStreamId, options: { appealZakatEligible?: boolean } = {}): GivingIntentId[] {
  switch (ZAKAT_POLICY[stream]) {
    case "CHOOSABLE": return ["GENERAL", "SADAQAH", "ZAKAT"];
    case "PER_APPEAL": return options.appealZakatEligible === true ? ["GENERAL", "SADAQAH", "ZAKAT"] : ["GENERAL", "SADAQAH"];
    default: return ["GENERAL", "SADAQAH"];
  }
}

export function isIntentAllowed(stream: GivingStreamId, intent: string, options: { appealZakatEligible?: boolean } = {}): boolean {
  return (allowedIntents(stream, options) as string[]).includes(intent);
}

// Visible tag for streams that never take Zakat; null when no fixed notice applies.
export function zakatNotice(stream: GivingStreamId): string | null {
  return ZAKAT_POLICY[stream] === "NOT_ACCEPTED"
    ? "Zakat is not accepted for this drive. Only non-Zakat contributions (General Charity or Sadaqah) are accepted."
    : null;
}

export type LedgerRow = { stream: string; givingIntent: string; status: string; amountPaise: number; refundedPaise: number };
export type LedgerBucket = { receivedPaise: number; pendingVerificationPaise: number; refundedPaise: number };

// Received counts only verified (captured) money, net of refunds. Pending bank/UPI claims are shown
// separately and never added to received.
export function summariseLedger(rows: LedgerRow[]) {
  const empty = (): LedgerBucket => ({ receivedPaise: 0, pendingVerificationPaise: 0, refundedPaise: 0 });
  const byStream: Record<string, LedgerBucket> = {};
  const zakat = empty();
  for (const row of rows) {
    const buckets = [byStream[row.stream] ??= empty()];
    if (row.givingIntent === "ZAKAT") buckets.push(zakat);
    for (const bucket of buckets) {
      if (row.status === "CAPTURED" || row.status === "REFUNDED") {
        bucket.receivedPaise += row.amountPaise - row.refundedPaise;
        bucket.refundedPaise += row.refundedPaise;
      } else if (row.status === "PENDING_VERIFICATION") {
        bucket.pendingVerificationPaise += row.amountPaise;
      }
    }
  }
  return { byStream, zakat };
}
