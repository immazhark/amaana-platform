export const NOTIFICATION_STALE_PROCESSING_MS = 15 * 60 * 1000;
export const NOTIFICATION_OVERDUE_MS = 15 * 60 * 1000;
export const TERMINAL_NOTIFICATION_SCHEDULE = new Date("9999-01-01T00:00:00.000Z");

export type NotificationOperationalCounts = {
  staleProcessing: number;
  overdueDue: number;
  terminalFailures: number;
};

export type DonationOperationalCounts = {
  unmatchedCriticalEvents: number;
  missingAcknowledgements: number;
  refundedWithoutCompletionTime: number;
};

export function notificationOperationalState(counts: NotificationOperationalCounts) {
  const normalized = {
    staleProcessing: Math.max(0, Math.trunc(counts.staleProcessing)),
    overdueDue: Math.max(0, Math.trunc(counts.overdueDue)),
    terminalFailures: Math.max(0, Math.trunc(counts.terminalFailures)),
  };
  const attention = normalized.staleProcessing + normalized.overdueDue + normalized.terminalFailures;
  return {
    ...normalized,
    attention,
    status: attention > 0 ? "attention" as const : "healthy" as const,
  };
}

export function donationOperationalState(counts: DonationOperationalCounts) {
  const normalized = {
    unmatchedCriticalEvents: Math.max(0, Math.trunc(counts.unmatchedCriticalEvents)),
    missingAcknowledgements: Math.max(0, Math.trunc(counts.missingAcknowledgements)),
    refundedWithoutCompletionTime: Math.max(0, Math.trunc(counts.refundedWithoutCompletionTime)),
  };
  const attention =
    normalized.unmatchedCriticalEvents +
    normalized.missingAcknowledgements +
    normalized.refundedWithoutCompletionTime;
  return {
    ...normalized,
    attention,
    status: attention > 0 ? "attention" as const : "healthy" as const,
  };
}
