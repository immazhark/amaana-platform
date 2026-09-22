import { NotificationChannel } from "@prisma/client";
import { shouldMarkAppealFunded } from "@/lib/appeals";
import { createReceiptNumber } from "@/lib/donations";
import { prisma } from "@/lib/prisma";
import { withSerializableTransactionRetry } from "@/lib/prisma-transaction";
import { fetchRazorpayPayment } from "@/lib/razorpay";

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
  return withSerializableTransactionRetry(async tx => {
    const donation = await tx.donation.findUnique({
      where: { providerOrderId },
      select: {
        id: true,
        currency: true,
        amount: true,
        referenceNumber: true,
        appealId: true,
        donorEmail: true,
        givingIntent: true,
        receiptTokenHash: true,
      },
    });
    const expectedAmountPaise = donation ? donation.amount.mul(100).toNumber() : null;
    if (
      !donation ||
      donation.currency !== "INR" ||
      !Number.isSafeInteger(expectedAmountPaise) ||
      expectedAmountPaise <= 0 ||
      !Number.isSafeInteger(amountPaise) ||
      amountPaise <= 0 ||
      expectedAmountPaise !== amountPaise
    ) {
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
      const appeal = await tx.appeal.update({
        where: { id: donation.appealId },
        data: { amountRaised: { increment: donation.amount } },
        select: {
          id: true,
          status: true,
          goalAmount: true,
          amountRaised: true,
        },
      });

      if (shouldMarkAppealFunded(appeal.status, appeal.amountRaised, appeal.goalAmount)) {
        await tx.appeal.updateMany({
          where: { id: appeal.id, status: "PUBLISHED" },
          data: { status: "FUNDED" },
        });
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


export async function ensureCapturedDonationForRefund(paymentId: string) {
  const localPayment = await prisma.donation.findUnique({
    where: { providerPaymentId: paymentId },
    select: { id: true, status: true },
  });

  if (localPayment && ["CAPTURED", "REFUNDED"].includes(localPayment.status)) {
    return { donationId: localPayment.id, matched: true, alreadyCaptured: true };
  }

  const providerPayment = await fetchRazorpayPayment(paymentId);
  if (
    providerPayment.id !== paymentId ||
    providerPayment.currency !== "INR" ||
    !providerPayment.order_id ||
    !Number.isSafeInteger(providerPayment.amount)
  ) {
    throw new Error("Refund payment lookup returned an invalid payment");
  }

  const donationByOrder = await prisma.donation.findUnique({
    where: { providerOrderId: providerPayment.order_id },
    select: { id: true, amount: true },
  });

  if (!donationByOrder) {
    return { donationId: null, matched: false, alreadyCaptured: false };
  }

  const expectedAmountPaise = donationByOrder.amount.mul(100).toNumber();
  if (!Number.isSafeInteger(expectedAmountPaise) || expectedAmountPaise < 0 || providerPayment.amount !== expectedAmountPaise) {
    throw new Error("Refund payment amount does not match the local donation order");
  }

  const result = await captureDonation(
    providerPayment.order_id,
    providerPayment.id,
    providerPayment.amount,
  );

  return { donationId: result.donationId, matched: true, alreadyCaptured: false };
}
