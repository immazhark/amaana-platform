import type { Prisma } from "@prisma/client";

export type DonationException = "missing-acknowledgement" | "missing-refund-time";

/** The operational counters and their review queues must use the same record predicate. */
export function donationExceptionWhere(issue: DonationException): Prisma.DonationWhereInput {
  return issue === "missing-acknowledgement"
    ? { status: { in: ["CAPTURED", "REFUNDED"] }, receiptNumber: null }
    : { status: "REFUNDED", refundedAt: null };
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
  if (value === "missing-acknowledgement" || value === "missing-refund-time") {
    return { issue: value, invalid: false, scope: { AND: [donationExceptionWhere(value)] }, query: { issue: value } };
  }
  return { issue: null, invalid: true, scope: { AND: [{ id: { in: [] } }] }, query: { issue: "invalid" } };
}
