import { DonationPaymentMethod, DonationStatus, NotificationChannel } from "@prisma/client";
import { getRemainingAppealAmount, shouldMarkAppealFunded } from "@/lib/appeals";
import { createReceiptNumber } from "@/lib/donations";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";

const DIRECT_METHODS: DonationPaymentMethod[] = [DonationPaymentMethod.DIRECT_UPI, DonationPaymentMethod.BANK_TRANSFER];

export async function reconcileDirectDonation(input: {
  donationId: string;
  actorId: string;
  decision: "VERIFY" | "REJECT";
  notes: string;
}) {
  const notes = input.notes.trim();
  if (!input.donationId || !input.actorId) throw new Error("Donation and reviewer are required");
  if (notes.length < 3 || notes.length > 1000) throw new Error("Reconciliation notes must be between 3 and 1000 characters");

  return withSerializableTransactionRetry(async tx => {
    const donation = await tx.donation.findUnique({
      where: { id: input.donationId },
      select: {
        id: true,
        referenceNumber: true,
        appealId: true,
        donorEmail: true,
        givingIntent: true,
        amount: true,
        status: true,
        paymentMethod: true,
      },
    });
    if (!donation) throw new Error("Donation not found");
    if (!DIRECT_METHODS.includes(donation.paymentMethod)) throw new Error("Only direct transfers use manual reconciliation");
    if (donation.status !== DonationStatus.PENDING_VERIFICATION) throw new Error("Donation is no longer pending verification");

    const now = new Date();
    if (input.decision === "REJECT") {
      const changed = await tx.donation.updateMany({
        where: { id: donation.id, status: DonationStatus.PENDING_VERIFICATION },
        data: { status: DonationStatus.REJECTED, reconciliationNotes: notes, reconciledAt: now, reconciledById: input.actorId },
      });
      if (changed.count !== 1) throw new Error("Donation changed during reconciliation");
      await tx.auditEvent.create({ data: { actorId: input.actorId, action: "donation.transfer.reject", entityType: "Donation", entityId: donation.id, metadata: { paymentMethod: donation.paymentMethod } } });
      return { status: DonationStatus.REJECTED, referenceNumber: donation.referenceNumber };
    }

    const appealBefore = await tx.appeal.findUnique({ where: { id: donation.appealId }, select: { goalAmount: true, amountRaised: true, status: true } });
    if (!appealBefore) throw new Error("Appeal not found");
    const remaining = getRemainingAppealAmount(appealBefore.amountRaised, appealBefore.goalAmount);
    if (donation.amount.toNumber() > remaining) throw new Error("This transfer exceeds the appeal's remaining verified need and requires operator review");

    const changed = await tx.donation.updateMany({
      where: { id: donation.id, status: DonationStatus.PENDING_VERIFICATION },
      data: {
        status: DonationStatus.CAPTURED,
        receiptNumber: createReceiptNumber(donation.referenceNumber),
        capturedAt: now,
        reconciliationNotes: notes,
        reconciledAt: now,
        reconciledById: input.actorId,
      },
    });
    if (changed.count !== 1) throw new Error("Donation changed during reconciliation");

    const appeal = await tx.appeal.update({
      where: { id: donation.appealId },
      data: { amountRaised: { increment: donation.amount } },
      select: { id: true, status: true, goalAmount: true, amountRaised: true },
    });
    if (shouldMarkAppealFunded(appeal.status, appeal.amountRaised, appeal.goalAmount)) {
      await tx.appeal.updateMany({ where: { id: appeal.id, status: "PUBLISHED" }, data: { status: "FUNDED" } });
    }

    await tx.notification.create({
      data: {
        channel: NotificationChannel.EMAIL,
        recipient: donation.donorEmail,
        templateKey: "donation-acknowledgement",
        subject: "Thank you for supporting an Amaana Foundation appeal",
        payload: { referenceNumber: donation.referenceNumber, givingIntent: donation.givingIntent },
        donationId: donation.id,
      },
    });
    await tx.auditEvent.create({ data: { actorId: input.actorId, action: "donation.transfer.verify", entityType: "Donation", entityId: donation.id, metadata: { paymentMethod: donation.paymentMethod } } });
    return { status: DonationStatus.CAPTURED, referenceNumber: donation.referenceNumber };
  });
}
