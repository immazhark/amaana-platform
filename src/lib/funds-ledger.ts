import { prisma } from "@/lib/prisma";
import { summariseLedger, type LedgerRow } from "@/lib/giving-streams";

const toPaise = (rupees: { mul: (n: number) => { toNumber: () => number } }) => Math.round(rupees.mul(100).toNumber());

// Per-stream and total-Zakat account built only from verified (captured/refunded) and pending-verification donations.
export async function getFundsLedger() {
  const groups = await prisma.donation.groupBy({
    by: ["stream", "givingIntent", "status"],
    where: { status: { in: ["CAPTURED", "REFUNDED", "PENDING_VERIFICATION"] } },
    _sum: { amount: true, refundedAmount: true },
  });
  const rows: LedgerRow[] = groups.map(group => ({
    stream: group.stream,
    givingIntent: group.givingIntent,
    status: group.status,
    amountPaise: group._sum.amount ? toPaise(group._sum.amount) : 0,
    refundedPaise: group._sum.refundedAmount ? toPaise(group._sum.refundedAmount) : 0,
  }));
  return summariseLedger(rows);
}
