import type { Prisma } from "@prisma/client";

export type DonationException = "missing-acknowledgement" | "missing-refund-time" | "missing-capture-time";

/** The operational counters and their review queues must use the same record predicate. */
export function donationExceptionWhere(issue: DonationException): Prisma.DonationWhereInput {
  switch (issue) {
    case "missing-acknowledgement": return { status: { in: ["CAPTURED", "REFUNDED"] }, receiptNumber: null };
    case "missing-capture-time": return { status: { in: ["CAPTURED", "REFUNDED"] }, capturedAt: null };
    case "missing-refund-time": return { status: "REFUNDED", refundedAt: null };
  }
}

type ExceptionFilter = {
  issue: DonationException | null;
  invalid: boolean;
  scope: Prisma.DonationWhereInput;
  query: { issue?: string };
};

/** Unknown or repeated selectors match nothing; never reflect untrusted values into links. */
export function donationExceptionFilter(value: unknown): ExceptionFilter {
  if (value === undefined || value === "") return { issue: null, invalid: false, scope: {}, query: {} };
  if (value === "missing-acknowledgement" || value === "missing-refund-time" || value === "missing-capture-time") {
    return { issue: value, invalid: false, scope: { AND: [donationExceptionWhere(value)] }, query: { issue: value } };
  }
  return { issue: null, invalid: true, scope: { AND: [{ id: { in: [] } }] }, query: { issue: "invalid" } };
}

/** Count missing fields in one verified population, without reading donor records. */
export async function loadVerifiedEvidenceCounts(client: Pick<Prisma.TransactionClient, "donation">) {
  const { _count: counts } = await client.donation.aggregate({
    where: { status: { in: ["CAPTURED", "REFUNDED"] } },
    _count: { _all: true, receiptNumber: true, capturedAt: true },
  });
  if (![counts._all, counts.receiptNumber, counts.capturedAt].every(n => Number.isSafeInteger(n) && n >= 0) ||
      counts.receiptNumber > counts._all || counts.capturedAt > counts._all) {
    throw new Error("Inconsistent donation evidence counts");
  }
  return { missingAcknowledgements: counts._all - counts.receiptNumber, missingCaptureTimes: counts._all - counts.capturedAt };
}
