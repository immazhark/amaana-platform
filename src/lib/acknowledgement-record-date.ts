export function acknowledgementRecordDate(donation: { refundedAt: Date | null; capturedAt: Date | null; createdAt: Date }): Date {
  // The on-screen private record uses the latest recorded refund, then capture, then creation.
  // This is a presentation date, not a new payment, accounting or settlement event.
  return donation.refundedAt ?? donation.capturedAt ?? donation.createdAt;
}
