import { DonationPaymentMethod, DonationStatus, NotificationChannel } from "@prisma/client";
import { shouldMarkAppealFunded } from "@/lib/appeals";
import { createReceiptNumber } from "@/lib/donations";
import { requireDonationDestination, requireDonationFinancialDestination } from "@/lib/donation-destination";
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
  if (!["VERIFY", "REJECT"].includes(input.decision)) throw new Error("Invalid reconciliation decision");
  if (notes.length < 3 || notes.length > 1000) throw new Error("Reconciliation notes must be between 3 and 1000 characters");

  return withSerializableTransactionRetry(async tx => {
    const donation = await tx.donation.findUnique({
      where: { id: input.donationId },
      select: {
        id: true,
        referenceNumber: true,
        appealId: true,
        fundId: true,
        donorEmail: true,
        givingIntent: true,
        designationSnapshot: true,
        amount: true,
        currency: true,
        status: true,
        paymentMethod: true,
      },
    });
    if (!donation) throw new Error("Donation not found");
    if (!DIRECT_METHODS.includes(donation.paymentMethod)) throw new Error("Only direct transfers use manual reconciliation");
    if (donation.status !== DonationStatus.PENDING_VERIFICATION) throw new Error("Donation is no longer pending verification");
    const destination = requireDonationDestination(donation);

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

    requireDonationFinancialDestination(donation);
    const donationPaise = donation.amount.mul(100).toNumber();
    if (donation.currency !== "INR" || !Number.isSafeInteger(donationPaise) || donationPaise <= 0) {
      throw new Error("Invalid financial amounts for transfer reconciliation");
    }
    if (destination.kind === "APPEAL") {
      const appealBefore = await tx.appeal.findUnique({
        where: { id: destination.id }, select: { goalAmount: true, amountRaised: true, status: true },
      });
      if (!appealBefore) throw new Error("Appeal not found");
      const goalPaise = appealBefore.goalAmount.mul(100).toNumber();
      const raisedPaise = appealBefore.amountRaised.mul(100).toNumber();
      if (![goalPaise, raisedPaise].every(Number.isSafeInteger) ||
          goalPaise <= 0 || raisedPaise < 0) {
        throw new Error("Invalid financial amounts for transfer reconciliation");
      }
      if (donationPaise > Math.max(0, goalPaise - raisedPaise)) {
        throw new Error("This transfer exceeds the appeal's remaining verified need and requires operator review");
      }
    }

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

    if (destination.kind === "APPEAL") {
      const appeal = await tx.appeal.update({
        where: { id: destination.id },
        data: { amountRaised: { increment: donation.amount } },
        select: { id: true, status: true, goalAmount: true, amountRaised: true },
      });
      if (shouldMarkAppealFunded(appeal.status, appeal.amountRaised, appeal.goalAmount)) {
        await tx.appeal.updateMany({ where: { id: appeal.id, status: "PUBLISHED" }, data: { status: "FUNDED" } });
      }
    }
    // A verified fund transfer is counted directly from CAPTURED donation rows;
    // no appeal total is touched and no public fund checkout is activated.

    await tx.notification.create({
      data: {
        channel: NotificationChannel.EMAIL,
        recipient: donation.donorEmail,
        templateKey: "donation-acknowledgement",
        subject: destination.kind === "FUND"
          ? "Thank you for supporting an Amaana Foundation programme"
          : "Thank you for supporting an Amaana Foundation appeal",
        payload: { referenceNumber: donation.referenceNumber, givingIntent: donation.givingIntent, designationKind: destination.kind },
        donationId: donation.id,
      },
    });
    await tx.auditEvent.create({ data: { actorId: input.actorId, action: "donation.transfer.verify", entityType: "Donation", entityId: donation.id, metadata: { paymentMethod: donation.paymentMethod } } });
    return { status: DonationStatus.CAPTURED, referenceNumber: donation.referenceNumber };
  });
}
