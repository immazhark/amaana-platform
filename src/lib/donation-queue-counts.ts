import type { DonationIntent, DonationStatus } from "@prisma/client";

type QueueGroup = { status: DonationStatus; givingIntent: DonationIntent; _count: { _all: number } };

/** One joint snapshot supplies pagination and both filter marginals.
 * Each marginal applies the other selected filter, not its own dimension. */
export function summariseDonationQueueCounts(groups: readonly QueueGroup[], selectedStatus?: DonationStatus, selectedIntent?: DonationIntent) {
  const statusCounts = new Map<DonationStatus, number>();
  const intentCounts = new Map<DonationIntent, number>();
  let totalItems = 0;
  for (const { status, givingIntent, _count: { _all: count } } of groups) {
    const statusMatches = !selectedStatus || status === selectedStatus;
    const intentMatches = !selectedIntent || givingIntent === selectedIntent;
    if (intentMatches) statusCounts.set(status, (statusCounts.get(status) ?? 0) + count);
    if (statusMatches) intentCounts.set(givingIntent, (intentCounts.get(givingIntent) ?? 0) + count);
    if (statusMatches && intentMatches) totalItems += count;
  }
  return { statusCounts, intentCounts, totalItems };
}
