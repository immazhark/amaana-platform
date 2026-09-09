import { NotificationChannel } from "@prisma/client";
import { createReceiptNumber } from "@/lib/donations";
import { prisma } from "@/lib/prisma";

export async function captureDonation(providerOrderId: string, providerPaymentId: string, amountPaise: number) {
  return prisma.$transaction(async tx => {
    const donation = await tx.donation.findUnique({ where: { providerOrderId } });
    if (!donation || donation.currency !== "INR" || donation.amount.mul(100).toNumber() !== amountPaise) throw new Error("Payment does not match donation order");
    const changed = await tx.donation.updateMany({ where: { id: donation.id, status: { in: ["CREATED", "AUTHORIZED"] } }, data: { status: "CAPTURED", providerPaymentId, receiptNumber: createReceiptNumber(donation.referenceNumber), capturedAt: new Date() } });
    if (changed.count === 1) {
      await tx.appeal.update({ where: { id: donation.appealId }, data: { amountRaised: { increment: donation.amount } } });
      await tx.notification.create({ data: { channel: NotificationChannel.EMAIL, recipient: donation.donorEmail, templateKey: "donation-acknowledgement", subject: "Thank you for supporting an Amaana Foundation appeal", payload: { referenceNumber: donation.referenceNumber }, donationId: donation.id } });
    }
    return { donationId: donation.id, referenceNumber: donation.referenceNumber, receiptTokenHash: donation.receiptTokenHash, status: changed.count === 1 ? "CAPTURED" : donation.status };
  });
}
