import { NotificationChannel } from "@prisma/client";
import { createReceiptNumber } from "@/lib/donations";
import { prisma } from "@/lib/prisma";

/**
 * Marks a verified Razorpay payment as captured exactly once.
 *
 * A Razorpay order may see more than one payment attempt. A previous attempt can
 * fail and a later attempt for the same order can succeed. FAILED therefore is
 * intentionally recoverable to CAPTURED once Razorpay confirms a valid captured
 * payment for the same order, currency and amount. CAPTURED/REFUNDED records are
 * never incremented again, which keeps appeal totals idempotent.
 */
export async function captureDonation(providerOrderId: string, providerPaymentId: string, amountPaise: number) {
  return prisma.$transaction(async tx => {
    const donation = await tx.donation.findUnique({
      where: { providerOrderId },
      select: {
        id: true,
        currency: true,
        amount: true,
        referenceNumber: true,
        appealId: true,
        donorEmail: true,
        receiptTokenHash: true,
      },
    });
    if (!donation || donation.currency !== "INR" || donation.amount.mul(100).toNumber() !== amountPaise) {
      throw new Error("Payment does not match donation order");
    }

    const changed = await tx.donation.updateMany({
      where: { id: donation.id, status: { in: ["CREATED", "AUTHORIZED", "FAILED"] } },
      data: {
        status: "CAPTURED",
        providerPaymentId,
        receiptNumber: createReceiptNumber(donation.referenceNumber),
        capturedAt: new Date(),
        failedAt: null,
      },
    });

    if (changed.count === 1) {
      await tx.appeal.update({
        where: { id: donation.appealId },
        data: { amountRaised: { increment: donation.amount } },
      });

      await tx.notification.create({
        data: {
          channel: NotificationChannel.EMAIL,
          recipient: donation.donorEmail,
          templateKey: "donation-acknowledgement",
          subject: "Thank you for supporting an Amaana Foundation appeal",
          payload: { referenceNumber: donation.referenceNumber },
          donationId: donation.id,
        },
      });
    }

    const current = changed.count === 1
      ? { status: "CAPTURED" as const, providerPaymentId }
      : await tx.donation.findUnique({
          where: { id: donation.id },
          select: { status: true, providerPaymentId: true },
        });

    if (!current) throw new Error("Donation disappeared during payment reconciliation");

    return {
      donationId: donation.id,
      referenceNumber: donation.referenceNumber,
      receiptTokenHash: donation.receiptTokenHash,
      status: current.status,
      providerPaymentId: current.providerPaymentId,
    };
  });
}
